// Backend server for Gemini 2.5 Flash Image generation
// See: https://ai.google.dev/gemini-api/docs/image-generation

import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static('.'));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const STYLE_PROMPTS = {
  professional: "Corporate professional headshot with neutral background, well-lit, confident expression",
  casual: "Casual, relaxed, friendly headshot with natural lighting",
  creative: "Creative, artistic, colorful headshot with imaginative background",
  vintage: "Vintage film aesthetic headshot with classic color grading",
  modern: "Modern, clean, minimalist headshot with contemporary style",
  cinematic: "Cinematic headshot with dramatic lighting and shallow depth of field",
  editorial: "Fashion editorial style headshot, high fashion magazine look",
  outdoor: "Outdoor headshot with natural light and nature backdrop",
  studio: "Studio headshot with controlled professional lighting",
  monochrome: "Black and white monochrome headshot with elegant contrast",
  warm: "Warm tones headshot with golden hour lighting, cozy feel",
  cool: "Cool tones headshot with blue/teal color palette, crisp and clean",
  artistic: "Artistic, painterly headshot with expressive style",
  glam: "Glamorous high fashion headshot, luxurious and elegant",
  tech: "Futuristic tech aesthetic headshot with digital elements",
  banana: "Person wearing a fun banana costume suit, playful and vibrant",
};

// Original endpoint (kept for backwards compatibility)
app.post("/generate", upload.fields([
  { name: "profiles", maxCount: 10 },
  { name: "styleRef", maxCount: 1 },
]), async (req, res) => {
  try {
    const { styles, aspectRatio } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];

    if (!profileFiles.length || !selectedStyles.length) {
      return res.status(400).send("Missing profiles or styles");
    }

    const results = [];

    // For each selected style, generate an image combining all profiles
    for (const styleId of selectedStyles) {
      const stylePrompt = STYLE_PROMPTS[styleId] || "Professional headshot";
      
      // Build prompt with composition instruction
      let prompt = `Create a ${stylePrompt}. `;
      if (profileFiles.length > 1) {
        prompt += `Compose elements from all ${profileFiles.length} provided profile images into a single cohesive headshot. `;
      } else {
        prompt += `Use the provided profile image. `;
      }
      if (styleRefFile) {
        prompt += "Apply the style and aesthetic from the style reference image. ";
      }
      prompt += "Maintain facial features and likeness. High quality, professional result.";

      // Prepare input parts: text + images
      const parts = [{ text: prompt }];

      // Add profile images
      for (const file of profileFiles) {
        const imageData = fs.readFileSync(file.path, { encoding: "base64" });
        parts.push({
          inlineData: {
            mimeType: file.mimetype,
            data: imageData,
          },
        });
      }

      // Add style reference if provided
      if (styleRefFile) {
        const refData = fs.readFileSync(styleRefFile.path, { encoding: "base64" });
        parts.push({
          inlineData: {
            mimeType: styleRefFile.mimetype,
            data: refData,
          },
        });
      }

      console.log(`Generating style: ${styleId}`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: parts,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
          },
        },
      });

      // Extract generated image
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Image = part.inlineData.data;
          results.push({
            style: STYLE_PROMPTS[styleId] || styleId,
            dataUrl: `data:image/png;base64,${base64Image}`,
          });
        }
      }
    }

    // Cleanup uploaded files
    profileFiles.forEach(f => fs.unlinkSync(f.path));
    if (styleRefFile) fs.unlinkSync(styleRefFile.path);

    res.json(results);
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).send(error.message || "Generation failed");
  }
});

// Streaming endpoint for real-time progress updates
app.post("/generate-stream", upload.fields([
  { name: "profiles", maxCount: 10 },
  { name: "styleRef", maxCount: 1 },
]), async (req, res) => {
  try {
    const { styles, aspectRatio, primaryImageIndex, mixFaces } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
    const shouldMixFaces = mixFaces === 'true';

    if (!profileFiles.length || !selectedStyles.length) {
      return res.status(400).send("Missing profiles or styles");
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // For each selected style, generate an image combining all profiles
    for (const styleId of selectedStyles) {
      try {
        // Send progress update
        res.write(`data: ${JSON.stringify({ type: 'progress', styleId })}\n\n`);

        const stylePrompt = STYLE_PROMPTS[styleId] || "Professional headshot";
        
        // Build prompt with composition instruction based on user preferences
        let prompt = `Create a ${stylePrompt}. `;
        
        if (shouldMixFaces && profileFiles.length > 1) {
          // Mix/blend all faces together
          prompt += `Blend and mix facial features from all ${profileFiles.length} provided images to create a composite face. `;
          prompt += "Combine distinctive features from each image into a unified, cohesive face. ";
        } else if (profileFiles.length > 1) {
          // Use primary image for facial features, others for style/context
          prompt += `Use the facial features, expression, and likeness from image number ${primaryIdx + 1} as the primary reference. `;
          prompt += `Maintain this person's recognizable features while incorporating style elements from the other images. `;
        } else {
          // Single image
          prompt += `Use the provided profile image. `;
        }
        
        if (styleRefFile) {
          prompt += "Apply the style and aesthetic from the style reference image. ";
        }
        
        prompt += "Keep facial features recognizable and natural. High quality, professional result.";

        // Prepare input parts: text + images
        const parts = [{ text: prompt }];

        // Add profile images (primary image first if not mixing)
        if (!shouldMixFaces && profileFiles.length > 1) {
          // Add primary image first
          const primaryFile = profileFiles[primaryIdx];
          const primaryData = fs.readFileSync(primaryFile.path, { encoding: "base64" });
          parts.push({
            inlineData: {
              mimeType: primaryFile.mimetype,
              data: primaryData,
            },
          });
          
          // Then add other images
          for (let i = 0; i < profileFiles.length; i++) {
            if (i !== primaryIdx) {
              const file = profileFiles[i];
              const imageData = fs.readFileSync(file.path, { encoding: "base64" });
              parts.push({
                inlineData: {
                  mimeType: file.mimetype,
                  data: imageData,
                },
              });
            }
          }
        } else {
          // Add all images in order (for mixing or single image)
          for (const file of profileFiles) {
            const imageData = fs.readFileSync(file.path, { encoding: "base64" });
            parts.push({
              inlineData: {
                mimeType: file.mimetype,
                data: imageData,
              },
            });
          }
        }

        // Add style reference if provided
        if (styleRefFile) {
          const refData = fs.readFileSync(styleRefFile.path, { encoding: "base64" });
          parts.push({
            inlineData: {
              mimeType: styleRefFile.mimetype,
              data: refData,
            },
          });
        }

        console.log(`Generating style: ${styleId} (primary: ${primaryIdx}, mix: ${shouldMixFaces})`);
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: parts,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || "1:1",
            },
          },
        });

        // Extract generated image and send result
        if (!response.candidates || !response.candidates[0]) {
          throw new Error(`No candidates in response. Response: ${JSON.stringify(response).substring(0, 500)}`);
        }
        
        if (!response.candidates[0].content || !response.candidates[0].content.parts) {
          throw new Error(`No content parts in response. Candidate: ${JSON.stringify(response.candidates[0]).substring(0, 500)}`);
        }

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Image = part.inlineData.data;
            const result = {
              style: STYLE_PROMPTS[styleId] || styleId,
              dataUrl: `data:image/png;base64,${base64Image}`,
            };
            res.write(`data: ${JSON.stringify({ type: 'result', styleId, result })}\n\n`);
          }
        }
      } catch (error) {
        console.error(`Error generating style ${styleId}:`, error);
        res.write(`data: ${JSON.stringify({ type: 'error', styleId, error: error.message })}\n\n`);
      }
    }

    // Cleanup uploaded files
    profileFiles.forEach(f => fs.unlinkSync(f.path));
    if (styleRefFile) fs.unlinkSync(styleRefFile.path);

    res.end();
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).send(error.message || "Generation failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍌 Banana Headshot Generator backend running on http://localhost:${PORT}`);
});
