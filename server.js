// Backend server for Gemini 2.5 Flash Image generation
// See: https://ai.google.dev/gemini-api/docs/image-generation

import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

// Import prompt configuration
const promptConfig = JSON.parse(fs.readFileSync('./prompt-config.json', 'utf8'));

// Prompt builder function
function buildPrompt(stylePrompt, year, gear, imageCount = 1) {
  let prompt = '';
  
  promptConfig.order.forEach(sectionKey => {
    const section = promptConfig.sections[sectionKey];
    prompt += `\n${section.title}:\n`;
    
    if (section.template) {
      // Replace template variables
      let text = section.template
        .replace(/{{stylePrompt}}/g, stylePrompt)
        .replace(/{{year}}/g, year)
        .replace(/{{camera}}/g, gear.camera)
        .replace(/{{lens}}/g, gear.lens)
        .replace(/{{iso}}/g, gear.iso)
        .replace(/{{aperture}}/g, gear.aperture)
        .replace(/{{shutter}}/g, gear.shutter)
        .replace(/{{lighting}}/g, gear.lighting);
      prompt += text + '\n';
    } else if (section.standard && section.multiAngle) {
      // NEW: Choose version based on image count
      const content = imageCount >= 3 ? section.multiAngle : section.standard;
      prompt += content + '\n';
    } else {
      prompt += section.content + '\n';
    }
  });
  
  return prompt;
}

const app = express();
const upload = multer({ dest: "uploads/" });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🔍 INCOMING REQUEST: ${req.method} ${req.url}`);
  console.log(`🔍 Headers:`, {
    'content-type': req.headers['content-type'],
    'origin': req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`🔍 Body keys:`, Object.keys(req.body));
  }
  next();
});

// Serve static frontend files
app.use(express.static('.'));

// Serve uploaded/generated images
app.use('/uploads', express.static('uploads'));

// Initialize GoogleGenAI with better error handling and debugging
let ai;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('🔍 API Key Debug Info:', {
    exists: !!apiKey,
    length: apiKey?.length || 0,
    startsWith: apiKey?.substring(0, 10) + '...' || 'undefined',
    envVars: Object.keys(process.env).filter(k => k.includes('GEMINI'))
  });
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable is not set!');
    console.error('❌ Available env vars:', Object.keys(process.env).sort());
    throw new Error('GEMINI_API_KEY is required');
  }
  
  console.log('✅ Initializing GoogleGenAI...');
  ai = new GoogleGenAI({
    apiKey: apiKey,
  });
  console.log('✅ GoogleGenAI initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize GoogleGenAI:', error.message);
  console.error('❌ This will cause API calls to fail');
  // Don't exit - let the server start but log the error
}

// Add debug endpoint to test API key
app.get('/debug-api', async (req, res) => {
  try {
    console.log('🔍 Debug API endpoint called');
    
    if (!ai) {
      return res.status(500).json({ 
        error: 'GoogleGenAI not initialized',
        apiKeyExists: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        envVars: Object.keys(process.env).filter(k => k.includes('GEMINI'))
      });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY not set',
        envVars: Object.keys(process.env).filter(k => k.includes('GEMINI'))
      });
    }
    
    // Test a simple API call
    console.log('🔍 Testing API call...');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ text: "Generate a simple test image of a lemon" }],
    });
    
    console.log('✅ API test successful');
    res.json({ 
      status: 'success', 
      message: 'API key is working',
      hasResponse: !!response,
      responseStructure: {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      apiKeyExists: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    });
  }
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
  dreamscape: "Soft pastel lighting, gentle blur effects, ethereal portrait with dreamy atmosphere",
  retrowave: "Hot magentas, teal highlights, VHS glow, feels like 1986 in the future",
  forestlight: "Sun filtering through leaves, warm green reflections, cinematic calm",
  metropolis: "Urban night, reflections on wet asphalt, blue-orange contrast, Blade Runner rain",
  polaroid90s: "Instant camera aesthetic, bright flash lighting, vintage 90s photography style",
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
  
  // Music/Subculture styles
  rocknroll: "Classic rock star energy — leather jacket, attitude, stage lighting, rebellious confidence",
  gothmetal: "Dark romantic aesthetic, dramatic makeup, moody shadows, Victorian meets metal concert",
  emo: "Early 2000s emo band photo shoot — side-swept hair, band tee, introspective gaze, MySpace era nostalgia",
  
  // Animal styles
  wildcat: "Fierce feline energy — sharp features, amber lighting, predator confidence, wild elegance",
  eagle: "Majestic bird of prey aesthetic — sharp gaze, mountainous backdrop, regal posture, soaring spirit",
  dolphin: "Playful aquatic vibe — bright blue tones, splashing energy, joyful expression, ocean shimmer",
  
  // Pokemon styles
  pikachu: "Electric yellow energy, cheerful spark, bright eyes, playful lightning bolt accents, Pokemon trainer card aesthetic",
  charizard: "Fiery orange-red tones, confident power pose, flame effects, legendary Pokemon energy",
  mewtwo: "Mysterious purple psychic glow, intense focused stare, futuristic background, legendary presence",
  
  // Trading card styles
  garbagepail: "Grotesque cartoon caricature style, exaggerated features, vibrant colors, 1980s Garbage Pail Kids card aesthetic with glossy finish",
  magiccard: "Epic fantasy portrait, ornate border frame, mystical glow, Magic: The Gathering card aesthetic with dramatic lighting",
  pokemoncard: "Official Pokemon trading card style — bright colors, holographic sheen, centered portrait with stats border",
  
  // Gaming character styles
  minecraft: "Blocky pixelated aesthetic, cubic head shape, simplified features, Minecraft character card style with game UI elements",
  fortnite: "Stylized cartoon character, bold outlines, vibrant colors, Fortnite loading screen aesthetic with dynamic pose",
  roblox: "Simplified blocky character design, Roblox avatar style, bright primary colors, playful geometric features",
};

// Original endpoint (kept for backwards compatibility)
app.post("/generate", upload.fields([
  { name: "profiles", maxCount: 10 },
  { name: "styleRef", maxCount: 1 },
]), async (req, res) => {
  try {
    const { styles, primaryImageIndex, multiAngle, portraitAngle, year } = req.body;
    console.log(`🔍 SERVER DEBUG: Year setting: ${year}`);    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
    const shouldMultiAngle = multiAngle === "true";

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
      
      // Dynamic camera gear and lighting selection based on year
      const getCameraGear = (year) => {
        if (year >= 2020) return { 
          camera: "Canon EOS R5", 
          lens: "85mm f/1.4L", 
          iso: "ISO 100", 
          aperture: "f/2.8", 
          shutter: "1/125s",
          lighting: "soft LED panel"
        };
        if (year >= 2010) return { 
          camera: "Canon 5D Mark II", 
          lens: "85mm f/1.8", 
          iso: "ISO 200", 
          aperture: "f/2.8", 
          shutter: "1/125s",
          lighting: "studio strobe"
        };
        if (year >= 2000) return { 
          camera: "Canon EOS-1D", 
          lens: "85mm f/1.8", 
          iso: "ISO 400", 
          aperture: "f/3.5", 
          shutter: "1/60s",
          lighting: "hot shoe flash"
        };
        if (year >= 1990) return { 
          camera: "Canon EOS 1", 
          lens: "85mm f/1.8", 
          iso: "ISO 400", 
          aperture: "f/4", 
          shutter: "1/60s",
          lighting: "studio tungsten"
        };
        if (year >= 1980) return { 
          camera: "Canon AE-1", 
          lens: "85mm f/2", 
          iso: "ISO 200", 
          aperture: "f/4", 
          shutter: "1/30s",
          lighting: "natural window light"
        };
        if (year >= 1970) return { 
          camera: "Canon FTb", 
          lens: "85mm f/2.8", 
          iso: "ISO 100", 
          aperture: "f/5.6", 
          shutter: "1/15s",
          lighting: "incandescent bulb"
        };
        if (year >= 1960) return { 
          camera: "Canon P", 
          lens: "85mm f/3.5", 
          iso: "ISO 50", 
          aperture: "f/5.6", 
          shutter: "1/8s",
          lighting: "natural daylight"
        };
        return { 
          camera: "Canon VT", 
          lens: "85mm f/4", 
          iso: "ISO 25", 
          aperture: "f/8", 
          shutter: "1/4s",
          lighting: "available light"
        };
      };
      
      const gear = getCameraGear(yearNum);
      
      prompt = buildPrompt(stylePrompt, yearNum, gear, profileFiles.length);
      
      if (styleRefFile) {
        prompt += "\nApply the style and aesthetic from the style reference image.";
      }

      // Prepare input parts: text + images
      const parts = [{ text: prompt }];

      // Attach all images - the new prompt handles intelligent selection
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
    console.log('🔍 Generate-stream endpoint called');
    
    // Check if AI client is initialized
    if (!ai) {
      console.error('❌ GoogleGenAI not initialized - cannot process request');
      return res.status(500).json({ error: 'AI service not available' });
    }
    
    const { styles, primaryImageIndex, multiAngle, portraitAngle, year } = req.body;
    const selectedStyles = JSON.parse(styles || "[]");
    const profileFiles = req.files["profiles"] || [];
    const styleRefFile = req.files["styleRef"]?.[0];
    const primaryIdx = parseInt(primaryImageIndex) || 0;
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
      
      // Dynamic camera gear and lighting selection based on year
      const getCameraGear = (year) => {
        if (year >= 2020) return { 
          camera: "Canon EOS R5", 
          lens: "85mm f/1.4L", 
          iso: "ISO 100", 
          aperture: "f/2.8", 
          shutter: "1/125s",
          lighting: "soft LED panel"
        };
        if (year >= 2010) return { 
          camera: "Canon 5D Mark II", 
          lens: "85mm f/1.8", 
          iso: "ISO 200", 
          aperture: "f/2.8", 
          shutter: "1/125s",
          lighting: "studio strobe"
        };
        if (year >= 2000) return { 
          camera: "Canon EOS-1D", 
          lens: "85mm f/1.8", 
          iso: "ISO 400", 
          aperture: "f/3.5", 
          shutter: "1/60s",
          lighting: "hot shoe flash"
        };
        if (year >= 1990) return { 
          camera: "Canon EOS 1", 
          lens: "85mm f/1.8", 
          iso: "ISO 400", 
          aperture: "f/4", 
          shutter: "1/60s",
          lighting: "studio tungsten"
        };
        if (year >= 1980) return { 
          camera: "Canon AE-1", 
          lens: "85mm f/2", 
          iso: "ISO 200", 
          aperture: "f/4", 
          shutter: "1/30s",
          lighting: "natural window light"
        };
        if (year >= 1970) return { 
          camera: "Canon FTb", 
          lens: "85mm f/2.8", 
          iso: "ISO 100", 
          aperture: "f/5.6", 
          shutter: "1/15s",
          lighting: "incandescent bulb"
        };
        if (year >= 1960) return { 
          camera: "Canon P", 
          lens: "85mm f/3.5", 
          iso: "ISO 50", 
          aperture: "f/5.6", 
          shutter: "1/8s",
          lighting: "natural daylight"
        };
        return { 
          camera: "Canon VT", 
          lens: "85mm f/4", 
          iso: "ISO 25", 
          aperture: "f/8", 
          shutter: "1/4s",
          lighting: "available light"
        };
      };
      
      const gear = getCameraGear(yearNum);
      
      prompt = buildPrompt(stylePrompt, yearNum, gear, profileFiles.length);
        
      if (styleRefFile) {
        prompt += "\nApply the style and aesthetic from the style reference image.";
      }

        // Prepare input parts: text + images
        const parts = [{ text: prompt }];

        // Attach all images - the new prompt handles intelligent selection
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

        console.log(`Generating style: ${styleId} (primary: ${primaryIdx})`);
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

// Stripe payment endpoint
app.post('/create-payment', async (req, res) => {
  try {
    const { imageId, styleName } = req.body;
    
    if (!imageId || !styleName) {
      return res.status(400).json({ error: 'Image ID and style name required' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: { 
            name: `AI Headshot: ${styleName}`,
            description: 'Download your generated headshot'
          },
          unit_amount: 1000, // 1000 öre = 10.00 SEK
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/download?session_id={CHECKOUT_SESSION_ID}&image=${imageId}`,
      cancel_url: `${req.headers.origin}/`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// Download endpoint for successful payments
app.get('/download', async (req, res) => {
  try {
    const { session_id, image } = req.query;
    
    if (!session_id || !image) {
      return res.status(400).send('Missing session_id or image parameter');
    }
    
    // Verify the payment session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      // Payment was successful - redirect to main page with session info
      res.redirect(`/?show_results=true&image=${image}&session_id=${session_id}`);
    } else {
      // Payment not completed
      res.redirect('/?payment_failed=true');
    }
  } catch (error) {
    console.error('Download endpoint error:', error);
    res.redirect('/?payment_error=true');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍋 lemon Headshot Generator backend running on http://localhost:${PORT}`);
  console.log(`🚀 Server started successfully with latest code!`);
  console.log(`🔍 Debug endpoint available at: http://localhost:${PORT}/debug-api`);
  console.log(`🔍 Request logging enabled - all incoming requests will be logged`);
});