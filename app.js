// AI Headshot Generator — Gemini 2.5 Flash Image API

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
  neon: "Moody cyberpunk portrait, neon reflections, cinematic fog",
  coffee: "Warm café lighting, shallow depth of field, natural expression",
  rain: "Soft lighting through raindrops, reflective glass, melancholic city glow",
  bwfilm: "High contrast monochrome, vintage 1950s style, shadow play and hard light"
};

const STYLES = [
  { id: "basic", title: "Basic", desc: "Simple, clean composition — no drama, just you and good lighting.", funFactor: 2, moodPalette: ["#fefefe", "#d8d8d8", "#bcbcbc"] },
  { id: "professional", title: "Professional", desc: "Corporate, crisp, confident. Feels like LinkedIn but better.", funFactor: 3, moodPalette: ["#f9f9f9", "#e0e0e0", "#c4c4c4"] },
  { id: "creative", title: "Creative", desc: "Vibrant colors, bold lighting, slightly unhinged energy.", funFactor: 8, moodPalette: ["#ffd6d6", "#ff7b00", "#6b00ff"] },
  { id: "vintage", title: "Vintage", desc: "Classic film aesthetic — a portrait that smells faintly of nostalgia.", funFactor: 5, moodPalette: ["#e1b382", "#c89666", "#2d545e"] },
  { id: "cinematic", title: "Cinematic", desc: "Moody, dramatic — like your face is starring in an A24 movie.", funFactor: 9, moodPalette: ["#0f0f0f", "#ff9d00", "#1a5cff"] },
  { id: "editorial", title: "Editorial", desc: "Like a GQ or Vogue spread — confident, glossy, and a little dangerous.", funFactor: 6, moodPalette: ["#faf7f5", "#cfc6be", "#7f7b76"] },
  { id: "outdoor", title: "Outdoor", desc: "Golden hour, wind in your hair, a soft lens flare for good measure.", funFactor: 7, moodPalette: ["#ffd27f", "#ff9e6b", "#8bc6ec"] },
  { id: "studio", title: "Studio", desc: "Classic setup with perfect light ratios. Zero distractions.", funFactor: 3, moodPalette: ["#ffffff", "#eeeeee", "#dcdcdc"] },
  { id: "monochrome", title: "Monochrome", desc: "Black & white elegance. Less color, more soul.", funFactor: 4, moodPalette: ["#000000", "#444444", "#ffffff"] },
  { id: "warm", title: "Warm Tones", desc: "Golden hour magic — like sunlight hugging your skin.", funFactor: 6, moodPalette: ["#ffb347", "#ffcc33", "#ffe29f"] },
  { id: "cool", title: "Cool Tones", desc: "Crisp, clean, blue-toned perfection. The Iceland of headshots.", funFactor: 5, moodPalette: ["#dff1ff", "#9ecfff", "#3f72af"] },
  { id: "artistic", title: "Artistic", desc: "Painterly, expressive, the AI's inner Van Gogh coming alive.", funFactor: 9, moodPalette: ["#f3eac2", "#ffb6b9", "#a7c5eb"] },
  { id: "glam", title: "Glamorous", desc: "High fashion energy. Velvet, perfume, and flawless retouch.", funFactor: 7, moodPalette: ["#fce1f2", "#e3a3b5", "#c3738d"] },
  { id: "tech", title: "Tech", desc: "Futuristic neon lighting — like your face got scanned by a synthwave robot.", funFactor: 8, moodPalette: ["#0f2027", "#203a43", "#2c5364"] },
  { id: "lemon", title: "Lemon Edition 🍋", desc: "Bright, tangy, unapologetically fun. AI headshots with zest", funFactor: 10, moodPalette: ["#fff44f", "#ffd700", "#ffa500"] },
  { id: "dreamscape", title: "Dreamscape", desc: "Soft pastel haze, blurred edges, surreal glow like a memory half awake.", funFactor: 7, moodPalette: ["#e8d5ff", "#c7a3ff", "#9d4edd"] },
  { id: "retrowave", title: "Retrowave", desc: "Hot magentas, teal highlights, VHS glow, feels like 1986 in the future.", funFactor: 9, moodPalette: ["#ff006e", "#8338ec", "#3a86ff"] },
  { id: "forestlight", title: "Forest Light", desc: "Sun filtering through leaves, warm green reflections, cinematic calm.", funFactor: 6, moodPalette: ["#90ee90", "#32cd32", "#228b22"] },
  { id: "metropolis", title: "Metropolis", desc: "Urban night, reflections on wet asphalt, blue-orange contrast, Blade Runner rain.", funFactor: 8, moodPalette: ["#1e3a8a", "#3b82f6", "#f59e0b"] },
  { id: "polaroid90s", title: "Polaroid 90s", desc: "Slightly faded flash photo, harsh light, overexposed joy and nostalgia.", funFactor: 7, moodPalette: ["#fef3c7", "#fbbf24", "#f59e0b"] },
  { id: "nightshift", title: "Night Shift", desc: "Dim desk lamp light, deep shadows, late night introspection energy.", funFactor: 5, moodPalette: ["#1f2937", "#374151", "#6b7280"] },
  { id: "lemonpop", title: "Lemon Pop 🍋", desc: "Cheerful daylight, soft yellow gradient, spontaneous grin and warm energy.", funFactor: 9, moodPalette: ["#fef08a", "#fde047", "#facc15"] },
  { id: "astroglow", title: "Astro Glow", desc: "Galaxy gradient light, subtle stars behind you, violet tint, quiet confidence.", funFactor: 8, moodPalette: ["#7c3aed", "#a855f7", "#c084fc"] },
  { id: "candyshop", title: "Candy Shop", desc: "Saturated pinks and baby blues, playful studio light, glossy surfaces.", funFactor: 8, moodPalette: ["#fce7f3", "#f9a8d4", "#ec4899"] },
  { id: "ghostfilm", title: "Ghost Film", desc: "Desaturated monochrome with slight motion blur, hauntingly elegant.", funFactor: 6, moodPalette: ["#f3f4f6", "#d1d5db", "#9ca3af"] },
  { id: "lemonnoir", title: "Lemon Noir 🍋", desc: "Retro detective mood under neon lemon light, moody yet absurdly stylish.", funFactor: 9, moodPalette: ["#1f2937", "#fde047", "#f59e0b"] },
  { id: "neon", title: "Neon Noir", desc: "Moody cyberpunk portrait, neon reflections, cinematic fog.", funFactor: 8, moodPalette: ["#0f0f23", "#ff0080", "#00ffff"] },
  { id: "coffee", title: "Coffee Shop Documentary", desc: "Warm café lighting, shallow depth of field, natural expression.", funFactor: 5, moodPalette: ["#8b4513", "#d2691e", "#f4a460"] },
  { id: "rain", title: "Rainy Window", desc: "Soft lighting through raindrops, reflective glass, melancholic city glow.", funFactor: 6, moodPalette: ["#4682b4", "#87ceeb", "#b0c4de"] },
  { id: "bwfilm", title: "Analog Film Noir", desc: "High contrast monochrome, vintage 1950s style, shadow play and hard light.", funFactor: 7, moodPalette: ["#000000", "#404040", "#ffffff"] }
];

let selectedStyles = [];
let uploadedFiles = [];
let generatedResults = [];
let isGenerating = false;

// DOM elements
const profilesInput = document.getElementById("profilesInput");
const styleRefInput = document.getElementById("styleRefInput");
const generateBtn = document.getElementById("generateBtn");
const resultsContainer = document.getElementById("resultsContainer");
const progressContainer = document.getElementById("progressContainer");
const costEstimate = document.getElementById("costEstimate");
const clearResultsBtn = document.getElementById("clearResultsBtn");
const clearUploadsBtn = document.getElementById("clearUploadsBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const finalPromptPreview = document.getElementById("finalPromptPreview");
const yearSlider = document.getElementById("yearSlider");
const yearValue = document.getElementById("yearValue");
const primaryImageIndex = document.getElementById("primaryImageIndex");
const multiAngleToggle = document.getElementById("multiAngleToggle");
const mixFacesToggle = document.getElementById("mixFacesToggle");
const portraitAngle = document.getElementById("portraitAngle");
const uploadedPreviews = document.getElementById("uploadedPreviews");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  updateCostEstimate();
  updateYearDisplay();
  loadSavedResults();
  showEmptyUploadFrame();
});

function initializeEventListeners() {
  // File upload handlers
  profilesInput?.addEventListener("change", handleProfileUpload);
  styleRefInput?.addEventListener("change", handleStyleRefUpload);
  
  // Generation handler
  generateBtn?.addEventListener("click", handleGenerate);
  
  // Clear handlers
  clearResultsBtn?.addEventListener("click", clearResults);
  clearUploadsBtn?.addEventListener("click", clearUploads);
  downloadAllBtn?.addEventListener("click", downloadAllResults);
  
  // Year slider
  yearSlider?.addEventListener("input", updateYearDisplay);
  
  // Style selection
  document.addEventListener("click", handleStyleSelection);
  
  // Face composition mode
  document.addEventListener("change", handleFaceCompositionChange);
  
  // Portrait angle
  portraitAngle?.addEventListener("change", updateCostEstimate);
  
  // Add hover functionality for generate button
  addGenerateButtonHover();
}

function showEmptyUploadFrame() {
  if (!uploadedPreviews) return;
  
  uploadedPreviews.innerHTML = '';
  
  const previewTitle = document.createElement('h3');
  previewTitle.className = 'preview-title';
  previewTitle.textContent = 'Upload Your Images';
  uploadedPreviews.appendChild(previewTitle);
  
  const previewGrid = document.createElement('div');
  previewGrid.className = 'preview-grid';
  
  const emptyFrame = document.createElement('div');
  emptyFrame.className = 'empty-upload-frame';
  emptyFrame.addEventListener('click', () => {
    profilesInput.click();
  });
  
  const ctaButton = document.createElement('button');
  ctaButton.className = 'upload-cta-button';
  ctaButton.textContent = '+';
  
  const ctaText = document.createElement('div');
  ctaText.className = 'upload-cta-text';
  ctaText.textContent = 'Click to upload images';
  
  emptyFrame.appendChild(ctaButton);
  emptyFrame.appendChild(ctaText);
  previewGrid.appendChild(emptyFrame);
  
  uploadedPreviews.appendChild(previewGrid);
}

function handleProfileUpload(event) {
  const files = Array.from(event.target.files);
  uploadedFiles = files;
  
  console.log(`📁 Uploaded ${files.length} profile images`);
  
  // Update primary image index options
  updatePrimaryImageOptions();
  
  // Update cost estimate
  updateCostEstimate();
  
  // Show upload success
  showUploadSuccess(files.length);
  
  // Show uploaded images in polaroid frames
  showUploadedPreviews();
}

function showUploadedPreviews() {
  if (!uploadedPreviews) return;
  
  if (uploadedFiles.length === 0) {
    showEmptyUploadFrame();
    return;
  }
  
  const previewHTML = `
    <div class="preview-title">📸 Your Uploaded Images</div>
    <div class="preview-grid">
      ${uploadedFiles.map((file, index) => `
        <div class="preview-card ${index === 0 ? 'primary' : ''}" data-index="${index}">
          <div class="preview-image">
            <img src="${URL.createObjectURL(file)}" alt="${file.name}" />
            ${index === 0 ? '<div class="primary-badge">⭐ PRIMARY</div>' : ''}
          </div>
          <div class="preview-info">
            <div class="preview-filename">${file.name}</div>
            <div class="preview-size">${(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  uploadedPreviews.innerHTML = previewHTML;
}

function handleStyleRefUpload(event) {
  const file = event.target.files[0];
  if (file) {
    console.log(`🎨 Uploaded style reference: ${file.name}`);
    showUploadSuccess(1, "style reference");
  }
}

function updatePrimaryImageOptions() {
  if (!primaryImageIndex) return;
  
  primaryImageIndex.innerHTML = "";
  
  uploadedFiles.forEach((file, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${index + 1}. ${file.name}`;
    if (index === 0) option.textContent += " ⭐";
    primaryImageIndex.appendChild(option);
  });
}

function handleStyleSelection(event) {
  // Find the closest style-card element (handles clicks on child elements)
  const styleCard = event.target.closest('.style-card');
  if (!styleCard) return;
  
  const styleId = styleCard.dataset.styleId;
  if (!styleId) return;
  
  // Skip settings card - it's not a selectable style
  if (styleId === 'settings') return;
  
  // Single selection mode - deselect all others first
  document.querySelectorAll('.style-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  // Select only the clicked style
  selectedStyles = [styleId];
  styleCard.classList.add('selected');
  
  console.log(`🎨 Selected style: ${styleId}`);
  updateCostEstimate();
  updateGenerateButton();
}

function handleFaceCompositionChange(event) {
  if (event.target.id === "multiAngleToggle" || event.target.id === "mixFacesToggle") {
    updateCostEstimate();
  }
}

function updateYearDisplay() {
  if (yearValue && yearSlider) {
    yearValue.textContent = yearSlider.value;
  }
}

function updateCostEstimate() {
  if (!costEstimate) return;
  
  if (selectedStyles.length === 0) {
    costEstimate.textContent = "Estimated cost: $0.00 (≈ 0 SEK)";
    return;
  }
  
  // Calculate cost
  const costPerImage = 0.01;
  const totalCost = selectedStyles.length * costPerImage;
  const costInSek = totalCost * 10.5;
  
  costEstimate.textContent = `Estimated cost: $${totalCost.toFixed(2)} (≈ ${costInSek.toFixed(0)} SEK)`;
}

function updateGenerateButton() {
  if (!generateBtn) return;
  
  const hasFiles = uploadedFiles.length > 0;
  const hasStyles = selectedStyles.length > 0;
  const canGenerate = hasFiles && hasStyles && !isGenerating;
  
  generateBtn.disabled = !canGenerate;
  generateBtn.textContent = isGenerating ? "✨ Generating..." : "✨ Generate Headshots";
}

function showUploadSuccess(count, type = "images") {
  // Create a temporary success message
  const message = document.createElement("div");
  message.className = "upload-success";
  message.textContent = `✅ Uploaded ${count} ${type}`;
  message.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1000;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(message);
  
  setTimeout(() => {
    message.remove();
  }, 3000);
}

async function handleGenerate() {
  if (isGenerating) return;
  
  if (uploadedFiles.length === 0) {
    alert("Please upload at least one profile image.");
    return;
  }
  
  if (selectedStyles.length === 0) {
    alert("Please select at least one style.");
    return;
  }
  
  isGenerating = true;
  updateGenerateButton();
  
  try {
    console.log("🚀 Starting generation...");
    
    // Show progress container
    if (progressContainer) {
      progressContainer.style.display = "block";
      progressContainer.innerHTML = `
        <div class="progress-header">
          <h3>✨ Generating Your Headshots</h3>
          <div class="progress-stats">
            <span>${selectedStyles.length} styles selected</span>
            <span>•</span>
            <span>${uploadedFiles.length} images uploaded</span>
          </div>
        </div>
        <div class="progress-list" id="progressList"></div>
      `;
    }
    
    // Prepare form data
    const formData = new FormData();
    
    // Add profile images
    uploadedFiles.forEach((file, index) => {
      formData.append("profiles", file);
    });
    
    // Add style reference if uploaded
    const styleRefFile = styleRefInput?.files[0];
    if (styleRefFile) {
      formData.append("styleRef", styleRefFile);
    }
    
    // Add other parameters
    formData.append("styles", JSON.stringify(selectedStyles));
    formData.append("primaryImageIndex", primaryImageIndex?.value || "0");
    formData.append("multiAngle", multiAngleToggle?.checked ? "true" : "false");
    formData.append("mixFaces", mixFacesToggle?.checked ? "true" : "false");
    formData.append("portraitAngle", portraitAngle?.value || "front");
    
    // Get year setting from slider
    const yearValue = document.getElementById("yearSlider").value;
    formData.append("year", yearValue);
    
    // FIXED: Use relative URL instead of hardcoded localhost
    const res = await fetch("/generate-stream", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const progressList = document.getElementById("progressList");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log("📡 Received:", data);

            if (data.type === 'progress') {
              // Show progress for this style
              if (progressList) {
                const progressItem = document.createElement("div");
                progressItem.className = "progress-item";
                progressItem.innerHTML = `
                  <div class="progress-style">${STYLE_PROMPTS[data.styleId] || data.styleId}</div>
                  <div class="progress-status">🔄 Generating...</div>
                `;
                progressList.appendChild(progressItem);
              }
            } else if (data.type === 'result') {
              // Add result to generated results
              generatedResults.push({
                styleId: data.styleId,
                styleName: data.styleName,
                imageUrl: data.imageUrl,
                timestamp: Date.now()
              });

              // Update progress
              if (progressList) {
                const progressItems = progressList.querySelectorAll('.progress-item');
                const lastItem = progressItems[progressItems.length - 1];
                if (lastItem) {
                  lastItem.innerHTML = `
                    <div class="progress-style">${data.styleName}</div>
                    <div class="progress-status">✅ Complete</div>
                  `;
                }
              }

              // Add result to results container
              addResultToContainer(data);
            } else if (data.type === 'error') {
              console.error("❌ Generation error:", data.error);
              
              // Update progress with error
              if (progressList) {
                const progressItems = progressList.querySelectorAll('.progress-item');
                const lastItem = progressItems[progressItems.length - 1];
                if (lastItem) {
                  lastItem.innerHTML = `
                    <div class="progress-style">${data.styleId}</div>
                    <div class="progress-status">❌ Failed</div>
                  `;
                }
              }
            } else if (data.type === 'complete') {
              console.log(`✅ Style ${data.styleId} completed`);
            } else if (data.type === 'done') {
              console.log("🎉 All generations complete!");
              break;
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }

    // Hide progress container after a delay
    setTimeout(() => {
      if (progressContainer) {
        progressContainer.style.display = "none";
      }
    }, 2000);

    // Save results to localStorage
    saveResults();

  } catch (error) {
    console.error("Generation failed:", error);
    alert(`Generation failed: ${error.message}`);
    
    // Hide progress container
    if (progressContainer) {
      progressContainer.style.display = "none";
    }
  } finally {
    isGenerating = false;
    updateGenerateButton();
  }
}

function addResultToContainer(result) {
  if (!resultsContainer) return;

  const resultCard = document.createElement("div");
  resultCard.className = "result-card";
  resultCard.innerHTML = `
    <div class="result-image">
      <img src="${result.imageUrl}" alt="${result.styleName}" loading="lazy" />
      <div class="result-overlay">
        <button class="download-btn" onclick="downloadImage('${result.imageUrl}', '${result.styleId}')">
          💾 Save
        </button>
      </div>
    </div>
    <div class="result-info">
      <h4>${result.styleName}</h4>
      <p>${STYLE_PROMPTS[result.styleId] || result.styleId}</p>
    </div>
  `;

  resultsContainer.appendChild(resultCard);

  // Show download all button if we have 2+ results
  if (generatedResults.length >= 2 && downloadAllBtn) {
    downloadAllBtn.style.display = "block";
  }

  // Scroll to results
  resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function downloadImage(imageUrl, styleId) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `headshot_${styleId}_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAllResults() {
  generatedResults.forEach((result, index) => {
    setTimeout(() => {
      downloadImage(result.imageUrl, result.styleId);
    }, index * 500); // Stagger downloads
  });
}

function clearResults() {
  generatedResults = [];
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }
  if (downloadAllBtn) {
    downloadAllBtn.style.display = "none";
  }
  saveResults();
}

function clearUploads() {
  uploadedFiles = [];
  selectedStyles = [];
  
  if (profilesInput) profilesInput.value = "";
  if (styleRefInput) styleRefInput.value = "";
  if (primaryImageIndex) primaryImageIndex.innerHTML = "";
  
  // Clear style selections
  document.querySelectorAll(".style-card.selected").forEach(card => {
    card.classList.remove("selected");
  });
  
  // Reset upload previews
  showEmptyUploadFrame();
  
  updateCostEstimate();
  updateGenerateButton();
  
  console.log("🗑️ Cleared all uploads and selections");
}

function saveResults() {
  try {
    localStorage.setItem("lemonheadshots_results", JSON.stringify(generatedResults));
  } catch (e) {
    console.warn("Could not save results to localStorage:", e);
  }
}

function loadSavedResults() {
  try {
    const saved = localStorage.getItem("lemonheadshots_results");
    if (saved) {
      generatedResults = JSON.parse(saved);
      generatedResults.forEach(result => {
        addResultToContainer(result);
      });
    }
  } catch (e) {
    console.warn("Could not load results from localStorage:", e);
  }
}

// Update generate button state on page load
document.addEventListener("DOMContentLoaded", () => {
  updateGenerateButton();
});

function addGenerateButtonHover() {
  const generateBtn = document.getElementById("generateBtn");
  const promptPreview = document.getElementById("promptPreview");
  const promptPreviewText = document.getElementById("promptPreviewText");
  
  if (!generateBtn || !promptPreview || !promptPreviewText) return;
  
  // Show prompt preview on hover
  generateBtn.addEventListener("mouseenter", () => {
    if (uploadedFiles.length > 0 && selectedStyles.length > 0) {
      // Build the final prompt
      const finalPrompt = buildFinalPrompt();
      promptPreviewText.textContent = finalPrompt;
      promptPreview.style.display = "block";
    }
  });
  
  // Hide prompt preview when mouse leaves
  generateBtn.addEventListener("mouseleave", () => {
    promptPreview.style.display = "none";
  });
  
  // Close button functionality
  const closeBtn = promptPreview.querySelector(".prompt-preview-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      promptPreview.style.display = "none";
    });
  }
}

function buildFinalPrompt() {
  if (uploadedFiles.length === 0 || selectedStyles.length === 0) {
    return "Please upload images and select styles first.";
  }
  
  const styleId = selectedStyles[0]; // Single selection mode
  const style = STYLES.find(s => s.id === styleId);
  const stylePrompt = style ? style.desc : "Professional headshot";
  
  // Get year setting (default to 2025)
  const yearSlider = document.getElementById("yearSlider");
  const yearNum = parseInt(yearSlider?.value) || 2025;
  
  // Dynamic camera gear and lighting selection based on year (same as server)
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
  
  // Build the elaborate prompt (same as server)
  let prompt = `A ${stylePrompt} portrait photographed in the visual style of ${yearNum} — captured using camera gear, lighting, color tone, composition, and shot types typical of that era. Set the background and mood to match the ${stylePrompt} aesthetic. Let the year guide wardrobe and hair: era-accurate silhouettes, fabrics and accessories with natural fit and drape, and period-consistent hair finish rendered with real strand detail, subtle flyaways and believable hairline texture. Keep it photographic and tactile: visible skin micro-texture and pores, soft subsurface scattering, tiny asymmetries, authentic film grain and halation, gentle lens vignette, slight chromatic aberration and depth falloff. Use ${gear.lighting} shaping and ${gear.camera} + ${gear.lens} at ${gear.iso}, ${gear.aperture}, ${gear.shutter}. The image should embody the time's light, texture and attitude while you freely interpret the specific clothing and hairstyle within that period vocabulary; avoid plastic skin, painterly blur or CGI cleanliness.`;
  
  // Add image handling instructions
  if (uploadedFiles.length > 1) {
    prompt += ` IMPORTANT: Use ONLY the facial features from the FIRST image provided (image 1). The first image contains the primary person whose face must be preserved exactly. Do NOT use facial features from any other images - only use them for background, lighting, clothing, or pose reference. The result should look like the person in the first image, not any other image.`;
  } else {
    prompt += ` Use the provided profile image.`;
  }
  
  prompt += ` Keep facial features recognizable and natural. High quality, professional result.`;
  
  return prompt;
}