# AI Headshot Generator 🍌

Multi-image composition & style generation powered by **Gemini 2.5 Flash Image** (aka "Nano Banana"). Upload multiple profile images, select from a 4×4 grid of styles (professional, casual, creative, vintage, etc.), optionally add a style reference image, and generate high-quality styled headshots.

## Features

- **Multi-image composition**: Upload multiple profile images and compose them into one cohesive headshot
- **16 preset styles**: Professional, Casual, Creative, Vintage, Modern, Cinematic, Editorial, Outdoor, Studio, Monochrome, Warm Tones, Cool Tones, Artistic, Glamorous, Tech, and Banana Costume 🍌
- **Style reference image**: Optionally upload an image to transfer its style to your headshot
- **Aspect ratio control**: 1:1, 4:5, 3:4, 4:3, 16:9
- **Iterative refinement**: Generate and re-generate with different styles
- Powered by [Gemini Image Generation API](https://ai.google.dev/gemini-api/docs/image-generation)

## Getting Started

### Prerequisites
- Node.js 18+ (for backend)
- Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. **Clone or download this repo**:
   ```bash
   cd /Users/johansalo/BananaHeadshotGen
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Configure API key**:
   ```bash
   # Edit .env and add your GEMINI_API_KEY
   nano .env
   ```

4. **Start the backend server**:
   ```bash
   npm start
   # Runs on http://localhost:3000
   ```

5. **Serve the frontend** (in a separate terminal):
   ```bash
   python3 -m http.server 8000
   # Or: npx --yes serve -s . -l 8000
   ```

6. **Open the app**:
   ```
   http://localhost:8000
   ```

## Usage

1. Click **📷 Upload Profile Images (multi)** to select 1+ photos
2. Optionally upload a **🎨 Style Reference** image for style transfer
3. Click style cards in the 4×4 grid to select desired styles (multiple selection allowed)
4. Choose an **Aspect Ratio** from the dropdown
5. Click **✨ Generate Styles**
6. View results in the grid below; click **💾 Save** to download each

## How It Works

### Gemini Image Generation
- Backend receives profile images, selected styles, and optional style reference
- For each style, constructs a prompt (e.g., "Corporate professional headshot with neutral background")
- Calls `gemini-2.5-flash-image` model via the [Gemini API](https://ai.google.dev/gemini-api/docs/image-generation)
- Supports:
  - **Text-to-image**: Generate from descriptive prompts
  - **Image+text-to-image**: Edit existing images with text commands
  - **Multi-image composition**: Combine elements from multiple photos
  - **Style transfer**: Apply aesthetic from reference image
- Returns base64-encoded PNG images with SynthID watermarks

## Architecture

```
Frontend (index.html, app.js, styles.css)
  └─ Fetch API → Backend

Backend (server.js, Node.js + Express)
  ├─ Multer (file uploads)
  ├─ @google/genai SDK
  └─ Gemini 2.5 Flash Image API
```

## API Reference

- **Gemini Image Generation**: [https://ai.google.dev/gemini-api/docs/image-generation](https://ai.google.dev/gemini-api/docs/image-generation)
- **Google Gen AI SDK**: [@google/genai on npm](https://www.npmjs.com/package/@google/genai)

## Notes

- Gemini API calls are server-side; images uploaded to your backend, then sent to Google's API
- Generated images include SynthID digital watermarks
- Pricing: Token-based, ~1290 tokens per image (see [Gemini pricing](https://ai.google.dev/pricing))
- All generated images are 1024×1024 (or equivalent aspect ratio resolution)

## Example Styles

- **Professional**: Corporate headshot, neutral background, confident expression
- **Cinematic**: Dramatic lighting with shallow depth of field
- **Vintage**: Classic film aesthetic with period-appropriate color grading
- **Banana Costume 🍌**: Fun and playful banana suit overlay

## Credits

- Image generation: [Gemini 2.5 Flash Image (Nano Banana)](https://ai.google.dev/gemini-api/docs/image-generation)
- Built by Johan Salo

## License

MIT
