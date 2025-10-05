// Backend server for Gemini 2.5 Flash Image generation
// See: https://ai.google.dev/gemini-api/docs/image-generation

import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
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
  basic: "Create a natural headshot combining the uploaded images",
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
    const { styles, primaryImageIndex, mixFaces } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
    const shouldMixFaces = mixFaces === 'true';

    if (!profileFiles.length || !selectedStyles.length) {
      return res.status(400).send("Missing profiles or styles");
    }
    
    const stylesToProcess = selectedStyles;

    const results = [];
    for (const styleId of stylesToProcess) {
      const stylePrompt = STYLE_PROMPTS[styleId] || "Professional headshot";
      
      // Build prompt with composition instruction based on user preferences
      let prompt = `Create a ${stylePrompt}. `;
      
      if (shouldMixFaces && profileFiles.length > 1) {
        // Mix/blend all faces together
        prompt += `Blend and mix facial features from all ${profileFiles.length} provided images to create a composite face. `;
        prompt += "Combine distinctive features from each image into a unified, cohesive face. ";
      } else if (profileFiles.length > 1) {
        // Use primary image for facial features, others for style/context
        prompt += `IMPORTANT: Use ONLY the facial features from the FIRST image provided (image 1). `;
        prompt += `The first image contains the primary person whose face must be preserved exactly. `;
        prompt += `Do NOT use facial features from any other images - only use them for background, lighting, clothing, or pose reference. `;
        prompt += `The result should look like the person in the first image, not any other image. `;
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

      // SIMPLE FIX: When preserving primary face, ONLY send the primary image
      if (!shouldMixFaces && profileFiles.length > 1) {
        // Only send the primary image - this is the person whose face we want
        const primaryFile = profileFiles[primaryIdx];
        const primaryData = fs.readFileSync(primaryFile.path, { encoding: "base64" });
        parts.push({
          inlineData: {
            mimeType: primaryFile.mimetype,
            data: primaryData,
          },
        });
      } else {
        // For mixing or single image, add all images
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

      console.log(`Generating style: ${styleId}`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: parts,
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

    res.json({ results });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(error.message || "Generation failed");
  }
});

// Streaming endpoint for real-time progress updates
app.post("/generate-stream", upload.fields([
  { name: "profiles", maxCount: 10 },
  { name: "styleRef", maxCount: 1 },
]), async (req, res) => {
  try {
    const { styles, primaryImageIndex, mixFaces } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
    const shouldMixFaces = mixFaces === 'true';

    // Debug: Log what server receives
    console.log(`🔍 SERVER DEBUG: Primary index received: ${primaryIdx}`);
    console.log(`🔍 SERVER DEBUG: Total files: ${profileFiles.length}`);
    profileFiles.forEach((file, idx) => {
      console.log(`🔍 SERVER DEBUG: File ${idx}: ${file.originalname} (${idx === primaryIdx ? 'PRIMARY' : 'secondary'})`);
    });

    if (!profileFiles.length || !selectedStyles.length) {
      return res.status(400).send("Missing profiles or styles");
    }
    
    const stylesToProcess = selectedStyles;

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // For each selected style, generate an image combining all profiles
    for (const styleId of stylesToProcess) {
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
          prompt += `IMPORTANT: Use ONLY the facial features from the FIRST image provided (image 1). `;
          prompt += `The first image contains the primary person whose face must be preserved exactly. `;
          prompt += `Do NOT use facial features from any other images - only use them for background, lighting, clothing, or pose reference. `;
          prompt += `The result should look like the person in the first image, not any other image. `;
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

        // SIMPLE FIX: When preserving primary face, ONLY send the primary image
        if (!shouldMixFaces && profileFiles.length > 1) {
          // Only send the primary image - this is the person whose face we want
          const primaryFile = profileFiles[primaryIdx];
          const primaryData = fs.readFileSync(primaryFile.path, { encoding: "base64" });
          parts.push({
            inlineData: {
              mimeType: primaryFile.mimetype,
              data: primaryData,
            },
          });
        } else {
          // For mixing or single image, add all images
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
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: parts,
          });
          console.log(`✅ Style ${styleId} API call successful`);

          // Extract generated image
          let imageFound = false;
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64Image = part.inlineData.data;
              try {
                // Save image to file instead of sending base64 through SSE
                const filename = `${Date.now()}_${styleId}.png`;
                const filepath = path.join(process.cwd(), 'uploads', filename);
                
                // Convert base64 to buffer and save to file
                const imageBuffer = Buffer.from(base64Image, 'base64');
                fs.writeFileSync(filepath, imageBuffer);
                
                console.log(`✅ Saved image for ${styleId}: ${filename} (${imageBuffer.length} bytes)`);
                
                // Send image URL instead of base64 data
                const resultData = { 
                  type: 'result', 
                  styleId, 
                  styleName: STYLE_PROMPTS[styleId] || styleId,
                  imageUrl: `/uploads/${filename}`
                };
                const jsonString = JSON.stringify(resultData);
                console.log(`✅ Sending result for ${styleId}, JSON size: ${jsonString.length} chars`);
                res.write(`data: ${jsonString}\n\n`);
                imageFound = true;
              } catch (error) {
                console.error('Error saving result image:', error);
                res.write(`data: ${JSON.stringify({ type: 'error', styleId, error: 'Failed to save result image' })}\n\n`);
              }
            }
          }

          // Send completion update (only once per style)
          if (imageFound) {
            res.write(`data: ${JSON.stringify({ type: 'complete', styleId })}\n\n`);
          }

        } catch (apiError) {
          console.error(`❌ Style ${styleId} API call failed:`, apiError.message);
          res.write(`data: ${JSON.stringify({ type: 'error', styleId, error: apiError.message })}\n\n`);
        }

      } catch (styleError) {
        console.error(`Error generating style ${styleId}:`, styleError);
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          styleId, 
          error: styleError.message || 'Generation failed' 
        })}\n\n`);
      }
    }

    // Send final completion
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send(error.message || "Generation failed");
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍌 Banana Headshot Generator backend running on http://localhost:${PORT}`);
});