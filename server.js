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
  basic: "Simple, clean composition — no drama, just you and good lighting",
  professional: "Corporate, crisp, confident. Feels like LinkedIn but better",
  creative: "Vibrant colors, bold lighting, slightly unhinged energy",
  vintage: "Classic film aesthetic — a portrait that smells faintly of nostalgia",
  cinematic: "Moody, dramatic — like your face is starring in an A24 movie",
  editorial: "Like a GQ or Vogue spread — confident, glossy, and a little dangerous",
  outdoor: "Golden hour, wind in your hair, a soft lens flare for good measure",
  studio: "Classic setup with perfect light ratios. Zero distractions",
  monochrome: "Black & white elegance. Less color, more soul",
  warm: "Golden hour magic — like sunlight hugging your skin",
  cool: "Crisp, clean, blue-toned perfection. The Iceland of headshots",
  artistic: "Painterly, expressive, the AI's inner Van Gogh coming alive",
  glam: "High fashion energy. Velvet, perfume, and flawless retouch",
  tech: "Futuristic neon lighting — like your face got scanned by a synthwave robot",
  lemon: "Bright, tangy, unapologetically fun. AI headshots with zest. Include vibrant lemon-colored backgrounds, energetic poses, playful lighting, high saturation, whimsical vibe",
  dreamscape: "Soft pastel haze, blurred edges, surreal glow like a memory half awake",
  retrowave: "Hot magentas, teal highlights, VHS glow, feels like 1986 in the future",
  forestlight: "Sun filtering through leaves, warm green reflections, cinematic calm",
  metropolis: "Urban night, reflections on wet asphalt, blue-orange contrast, Blade Runner rain",
  polaroid90s: "Slightly faded flash photo, harsh light, overexposed joy and nostalgia",
  nightshift: "Dim desk lamp light, deep shadows, late night introspection energy",
  lemonpop: "Cheerful daylight, soft yellow gradient, spontaneous grin and warm energy",
  astroglow: "Galaxy gradient light, subtle stars behind you, violet tint, quiet confidence",
  candyshop: "Saturated pinks and baby blues, playful studio light, glossy surfaces",
  ghostfilm: "Desaturated monochrome with slight motion blur, hauntingly elegant",
  lemonnoir: "Retro detective mood under neon lemon light, moody yet absurdly stylish",
  // Additional styles from HTML that were missing
  neon: "Moody cyberpunk portrait, neon reflections, cinematic fog",
  coffee: "Warm café lighting, shallow depth of field, natural expression",
  rain: "Soft lighting through raindrops, reflective glass, melancholic city glow",
  bwfilm: "High contrast monochrome, vintage 1950s style, shadow play and hard light",
};

// Original endpoint (kept for backwards compatibility)
app.post("/generate", upload.fields([
  { name: "profiles", maxCount: 10 },
  { name: "styleRef", maxCount: 1 },
]), async (req, res) => {
  try {
    const { styles, primaryImageIndex, mixFaces, multiAngle, portraitAngle, year } = req.body;
    console.log(`🔍 SERVER DEBUG: Year setting: ${year}`);    const selectedStyles = JSON.parse(styles || "[]");
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
      let prompt = `Create a ${stylePrompt}`;
      
      // Add comprehensive cinematic film photography styling (always include year context)
      const yearNum = parseInt(year) || 2025;
      
      // Dynamic camera gear selection based on year
      const getCameraGear = (year) => {
        if (year >= 2020) return { camera: "Canon EOS R5", lens: "85mm f/1.4L", iso: "ISO 100", aperture: "f/2.8" };
        if (year >= 2010) return { camera: "Canon 5D Mark II", lens: "85mm f/1.8", iso: "ISO 200", aperture: "f/2.8" };
        if (year >= 2000) return { camera: "Canon EOS-1D", lens: "85mm f/1.8", iso: "ISO 400", aperture: "f/3.5" };
        if (year >= 1990) return { camera: "Canon EOS 1", lens: "85mm f/1.8", iso: "ISO 400", aperture: "f/4" };
        if (year >= 1980) return { camera: "Canon AE-1", lens: "85mm f/2", iso: "ISO 200", aperture: "f/4" };
        if (year >= 1970) return { camera: "Canon FTb", lens: "85mm f/2.8", iso: "ISO 100", aperture: "f/5.6" };
        if (year >= 1960) return { camera: "Canon P", lens: "85mm f/3.5", iso: "ISO 50", aperture: "f/5.6" };
        return { camera: "Canon VT", lens: "85mm f/4", iso: "ISO 25", aperture: "f/8" };
      };
      
      const gear = getCameraGear(yearNum);
      
      prompt = `A ${stylePrompt} portrait captured on handheld 35mm film using a ${gear.camera} with ${gear.lens} at ${gear.iso}, ${gear.aperture}. Photographed in the visual style of ${yearNum}. Golden hour film grain, analog imperfections, slight chromatic aberration, real lens halation, handheld focus softness.

Visible skin texture, natural pores, subtle asymmetry, micro-reflections in eyes.

The scene should feel photographic, tangible, and imperfect — like a scan of a real negative with dust and light leak.

Extreme realism, cinematic lighting, authentic color bleed, film depth, and emotional truth.`;
      
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
      } else if (shouldMultiAngle && profileFiles.length >= 3) {
        // Multi-angle analysis: send all images for facial analysis
        profileFiles.forEach(file => {
          const data = fs.readFileSync(file.path, { encoding: "base64" });
          parts.push({
            inlineData: {
              mimeType: file.mimetype,
              data: data,
            },
          });
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

      // Extract generated image with better error handling
      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
        console.error(`❌ Invalid API response structure:`, response);
        throw new Error("Invalid API response structure");
      }

      if (!response.candidates[0].content.parts) {
        console.error(`❌ No parts in API response:`, response.candidates[0].content);
        throw new Error("No parts in API response");
      }

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
    const { styles, primaryImageIndex, mixFaces, multiAngle, portraitAngle, year } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
    const shouldMixFaces = mixFaces === 'true';
    const shouldMultiAngle = multiAngle === "true";
    const selectedAngle = portraitAngle || "front";
    
    console.log(`🔍 SERVER DEBUG: Multi-angle analysis: ${shouldMultiAngle}`);
    console.log(`🔍 SERVER DEBUG: Selected angle: ${selectedAngle}`);
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
        let prompt = `Create a ${stylePrompt}`;
        
      // Add comprehensive cinematic film photography styling (always include year context)
      const yearNum = parseInt(year) || 2025;
      
      // Dynamic camera gear selection based on year
      const getCameraGear = (year) => {
        if (year >= 2020) return { camera: "Canon EOS R5", lens: "85mm f/1.4L", iso: "ISO 100", aperture: "f/2.8" };
        if (year >= 2010) return { camera: "Canon 5D Mark II", lens: "85mm f/1.8", iso: "ISO 200", aperture: "f/2.8" };
        if (year >= 2000) return { camera: "Canon EOS-1D", lens: "85mm f/1.8", iso: "ISO 400", aperture: "f/3.5" };
        if (year >= 1990) return { camera: "Canon EOS 1", lens: "85mm f/1.8", iso: "ISO 400", aperture: "f/4" };
        if (year >= 1980) return { camera: "Canon AE-1", lens: "85mm f/2", iso: "ISO 200", aperture: "f/4" };
        if (year >= 1970) return { camera: "Canon FTb", lens: "85mm f/2.8", iso: "ISO 100", aperture: "f/5.6" };
        if (year >= 1960) return { camera: "Canon P", lens: "85mm f/3.5", iso: "ISO 50", aperture: "f/5.6" };
        return { camera: "Canon VT", lens: "85mm f/4", iso: "ISO 25", aperture: "f/8" };
      };
      
      const gear = getCameraGear(yearNum);
      
      prompt = `A ${stylePrompt} portrait captured on handheld 35mm film using a ${gear.camera} with ${gear.lens} at ${gear.iso}, ${gear.aperture}. Photographed in the visual style of ${yearNum}. Golden hour film grain, analog imperfections, slight chromatic aberration, real lens halation, handheld focus softness.

Visible skin texture, natural pores, subtle asymmetry, micro-reflections in eyes.

The scene should feel photographic, tangible, and imperfect — like a scan of a real negative with dust and light leak.

Extreme realism, cinematic lighting, authentic color bleed, film depth, and emotional truth.`;
        
        if (shouldMixFaces && profileFiles.length > 1) {
          // Mix/blend all faces together
          prompt += `Blend and mix facial features from all ${profileFiles.length} provided images to create a composite face. `;
          prompt += "Combine distinctive features from each image into a unified, cohesive face. ";
        } else if (shouldMultiAngle && profileFiles.length >= 3) {
          // Multi-angle analysis mode
          const anglePrompts = {
            "front": "Generate a direct frontal portrait",
            "three-quarter": "Generate a 3/4 angle portrait, slightly turned to the side",
            "side": "Generate a side profile portrait",
            "looking-up": "Generate a portrait with the person looking upward",
            "looking-down": "Generate a portrait with the person looking downward"
          };
          
          prompt += `Analyze all ${profileFiles.length} provided images of the same person from different angles. `;
          prompt += `Build a comprehensive understanding of their facial structure, bone structure, and distinctive features. `;
          prompt += `Use this analysis to generate a consistent portrait that maintains their unique facial identity. `;
          prompt += `${anglePrompts[selectedAngle] || anglePrompts["front"]}. `;
          prompt += `Ensure the result is recognizably the same person across all generated images. `;
        } else if (profileFiles.length > 1) {
          // Use primary image only
          prompt += `Use the provided profile image. `;
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
        } else if (shouldMultiAngle && profileFiles.length >= 3) {
          // Multi-angle analysis: send all images for facial analysis
          profileFiles.forEach(file => {
            const data = fs.readFileSync(file.path, { encoding: "base64" });
            parts.push({
              inlineData: {
                mimeType: file.mimetype,
                data: data,
              },
            });
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
        console.log(`🎯 FINAL PROMPT SENT TO AI: "${prompt}"`);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: parts,
          });
          console.log(`✅ Style ${styleId} API call successful`);

          // Extract generated image with better error handling
          if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
            console.error(`❌ Invalid API response structure:`, response);
            throw new Error("Invalid API response structure");
          }

          if (!response.candidates[0].content.parts) {
            console.error(`❌ No parts in API response:`, response.candidates[0].content);
            throw new Error("No parts in API response");
          }

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

// Cost estimation endpoint
app.post('/api/estimate-cost', (req, res) => {
  try {
    const { selectedStyles } = req.body;
    
    if (!selectedStyles || !Array.isArray(selectedStyles)) {
      return res.status(400).json({ error: 'Selected styles required' });
    }
    
    // Gemini 2.0 Flash pricing (as of 2025)
    // Image generation: ~$0.01 per image
    // We'll use a conservative estimate
    const costPerImage = 0.01; // $0.01 per generated image
    const totalCost = selectedStyles.length * costPerImage;
    
    // Convert to SEK (approximate rate: 1 USD = 10.5 SEK)
    const sekRate = 10.5;
    const costInSek = totalCost * sekRate;
    
    res.json({
      costUSD: totalCost,
      costSEK: costInSek,
      stylesCount: selectedStyles.length,
      costPerImage: costPerImage
    });
    
  } catch (error) {
    console.error("Cost estimation error:", error);
    res.status(500).json({ error: 'Cost estimation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍌 Banana Headshot Generator backend running on http://localhost:${PORT}`);
});