// AI Headshot Generator — Gemini 2.5 Flash Image API

const STYLES = [
  { id: "basic", title: "Basic", desc: "Simple combination of uploaded images" },
  { id: "professional", title: "Professional", desc: "Corporate headshot with neutral background" },
  { id: "casual", title: "Casual", desc: "Relaxed, friendly vibe" },
  { id: "creative", title: "Creative", desc: "Artistic, colorful, imaginative" },
  { id: "vintage", title: "Vintage", desc: "Classic film aesthetic" },
  { id: "modern", title: "Modern", desc: "Clean, minimalist, contemporary" },
  { id: "cinematic", title: "Cinematic", desc: "Dramatic lighting and depth" },
  { id: "editorial", title: "Editorial", desc: "Fashion magazine style" },
  { id: "outdoor", title: "Outdoor", desc: "Natural light, nature backdrop" },
  { id: "studio", title: "Studio", desc: "Controlled studio lighting" },
  { id: "monochrome", title: "Monochrome", desc: "Black & white elegance" },
  { id: "warm", title: "Warm Tones", desc: "Golden hour, cozy feel" },
  { id: "cool", title: "Cool Tones", desc: "Blue, crisp, clean" },
  { id: "artistic", title: "Artistic", desc: "Painterly, expressive" },
  { id: "glam", title: "Glamorous", desc: "High fashion, luxurious" },
  { id: "tech", title: "Tech", desc: "Futuristic, digital aesthetic" },
  { id: "banana", title: "Banana Costume 🍌", desc: "Fun banana suit overlay" },
];

const profilesInput = document.getElementById("profilesInput");
// Style reference is handled through the style reference card, no separate input needed
const generateBtn = document.getElementById("generateBtn");
const stylesGrid = document.getElementById("stylesGrid");
const resultsGrid = document.getElementById("resultsGrid");
const resultsSection = document.getElementById("resultsSection");
const uploadedPreviews = document.getElementById("uploadedPreviews");
const progressContainer = document.getElementById("progressContainer");
const clearHeadshotsBtn = document.getElementById("clearHeadshotsBtn");
const costEstimation = document.getElementById("costEstimation");
const costAmount = document.getElementById("costAmount");
const costSek = document.getElementById("costSek");
// Profile label is now part of the button, no separate element needed
const clearUploadsBtn = document.getElementById("clearUploadsBtn");

let selectedStyles = new Set(['basic']); // Start with Basic selected by default
let uploadedProfiles = [];
let uploadedStyleRef = null;
let primaryImageIndex = 0; // Track which image preserves facial features
let generatedResults = []; // Store generated results for batch download

// Camera settings for each style
const CAMERA_SETTINGS = {
  basic: {
    camera: "Canon EOS R5",
    lens: "50mm f/1.8",
    iso: 200,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "softbox"
  },
  professional: {
    camera: "Canon EOS R5",
    lens: "85mm f/1.4",
    iso: 200,
    aperture: "f/2.0",
    shutter: "1/200s",
    lighting: "softbox"
  },
  casual: {
    camera: "Fujifilm X100V",
    lens: "35mm f/2.0",
    iso: 400,
    aperture: "f/2.0",
    shutter: "1/250s",
    lighting: "overcast"
  },
  creative: {
    camera: "Sony A7R IV",
    lens: "35mm f/2.0",
    iso: 400,
    aperture: "f/2.8",
    shutter: "1/250s",
    lighting: "harsh sunlight"
  },
  vintage: {
    camera: "Nikon Z9",
    lens: "85mm f/1.4",
    iso: 400,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "Rembrandt"
  },
  modern: {
    camera: "Sony A7R IV",
    lens: "50mm f/1.8",
    iso: 200,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "overcast"
  },
  cinematic: {
    camera: "Sony A7R IV",
    lens: "85mm f/1.4",
    iso: 400,
    aperture: "f/1.8",
    shutter: "1/160s",
    lighting: "Rembrandt"
  },
  editorial: {
    camera: "Nikon Z9",
    lens: "24-70mm f/2.8",
    iso: 200,
    aperture: "f/4",
    shutter: "1/200s",
    lighting: "softbox"
  },
  outdoor: {
    camera: "Fujifilm X100V",
    lens: "35mm f/2.0",
    iso: 200,
    aperture: "f/2.8",
    shutter: "1/500s",
    lighting: "golden hour"
  },
  studio: {
    camera: "Canon EOS R5",
    lens: "50mm f/1.8",
    iso: 100,
    aperture: "f/5.6",
    shutter: "1/160s",
    lighting: "softbox"
  },
  monochrome: {
    camera: "Nikon Z9",
    lens: "85mm f/1.4",
    iso: 400,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "Rembrandt"
  },
  warm: {
    camera: "Canon EOS R5",
    lens: "85mm f/1.4",
    iso: 200,
    aperture: "f/2.0",
    shutter: "1/250s",
    lighting: "golden hour"
  },
  cool: {
    camera: "Sony A7R IV",
    lens: "50mm f/1.8",
    iso: 200,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "overcast"
  },
  artistic: {
    camera: "Sony A7R IV",
    lens: "35mm f/2.0",
    iso: 400,
    aperture: "f/2.8",
    shutter: "1/250s",
    lighting: "harsh sunlight"
  },
  glam: {
    camera: "Canon EOS R5",
    lens: "85mm f/1.4",
    iso: 100,
    aperture: "f/2.8",
    shutter: "1/200s",
    lighting: "softbox"
  },
  tech: {
    camera: "Sony A7R IV",
    lens: "50mm f/1.8",
    iso: 200,
    aperture: "f/4",
    shutter: "1/200s",
    lighting: "overcast"
  },
  banana: {
    camera: "Fujifilm X100V",
    lens: "35mm f/2.0",
    iso: 400,
    aperture: "f/2.8",
    shutter: "1/250s",
    lighting: "golden hour"
  }
};

// Function to create advanced camera settings HTML
function createAdvancedSettingsHTML(style) {
  const settings = CAMERA_SETTINGS[style.id] || CAMERA_SETTINGS.basic;
  
  return `
    <div class="camera-display">
      <!-- Camera LCD Style Display -->
      <div class="camera-lcd">
        <div class="lcd-header">
          <span class="camera-name">${settings.camera}</span>
          <span class="rec-indicator">●</span>
          <span class="lens-name">${settings.lens}</span>
        </div>
        
        <div class="exposure-triangle">
          <div class="setting-group">
            <div class="setting-label">ISO</div>
            <div class="setting-value iso">${settings.iso}</div>
            <div class="setting-controls">
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'iso', -1)">-</button>
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'iso', 1)">+</button>
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">F</div>
            <div class="setting-value aperture">${settings.aperture}</div>
            <div class="setting-controls">
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'aperture', -1)">-</button>
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'aperture', 1)">+</button>
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">S</div>
            <div class="setting-value shutter">${settings.shutter}</div>
            <div class="setting-controls">
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'shutter', -1)">-</button>
              <button class="control-btn" onclick="adjustSetting('${style.id}', 'shutter', 1)">+</button>
            </div>
          </div>
        </div>
        
        <div class="lighting-info">
          <span class="light-label">Light:</span> 
          <span class="light-value">${settings.lighting}</span>
        </div>
      </div>
      
      <!-- Advanced Controls -->
      <div class="advanced-controls">
        <div class="control-row">
          <label class="control-label">Camera:</label>
          <select class="control-select" onchange="updateSetting('${style.id}', 'camera', this.value)">
            <option value="Canon EOS R5" ${settings.camera === 'Canon EOS R5' ? 'selected' : ''}>Canon EOS R5</option>
            <option value="Sony A7R IV" ${settings.camera === 'Sony A7R IV' ? 'selected' : ''}>Sony A7R IV</option>
            <option value="Nikon Z9" ${settings.camera === 'Nikon Z9' ? 'selected' : ''}>Nikon Z9</option>
            <option value="Fujifilm X100V" ${settings.camera === 'Fujifilm X100V' ? 'selected' : ''}>Fujifilm X100V</option>
          </select>
        </div>
        
        <div class="control-row">
          <label class="control-label">Lens:</label>
          <select class="control-select" onchange="updateSetting('${style.id}', 'lens', this.value)">
            <option value="85mm f/1.4" ${settings.lens === '85mm f/1.4' ? 'selected' : ''}>85mm f/1.4</option>
            <option value="50mm f/1.8" ${settings.lens === '50mm f/1.8' ? 'selected' : ''}>50mm f/1.8</option>
            <option value="35mm f/2.0" ${settings.lens === '35mm f/2.0' ? 'selected' : ''}>35mm f/2.0</option>
            <option value="24-70mm f/2.8" ${settings.lens === '24-70mm f/2.8' ? 'selected' : ''}>24-70mm f/2.8</option>
          </select>
        </div>
        
        <div class="control-row">
          <label class="control-label">Lighting:</label>
          <select class="control-select" onchange="updateSetting('${style.id}', 'lighting', this.value)">
            <option value="softbox" ${settings.lighting === 'softbox' ? 'selected' : ''}>Softbox</option>
            <option value="Rembrandt" ${settings.lighting === 'Rembrandt' ? 'selected' : ''}>Rembrandt</option>
            <option value="golden hour" ${settings.lighting === 'golden hour' ? 'selected' : ''}>Golden Hour</option>
            <option value="overcast" ${settings.lighting === 'overcast' ? 'selected' : ''}>Overcast</option>
            <option value="harsh sunlight" ${settings.lighting === 'harsh sunlight' ? 'selected' : ''}>Harsh Sunlight</option>
          </select>
        </div>
      </div>
      
      <!-- Prompt Preview -->
      <div class="prompt-preview">
        <div class="prompt-label">Enhanced Prompt:</div>
        <div class="prompt-text">${style.desc}, camera ${settings.camera}, lens ${settings.lens}, ISO ${settings.iso}, aperture ${settings.aperture}, shutter ${settings.shutter}, lighting ${settings.lighting}</div>
      </div>
    </div>
  `;
}

// Global functions for camera settings adjustments
window.adjustSetting = function(styleId, setting, direction) {
  const settings = CAMERA_SETTINGS[styleId];
  if (!settings) return;
  
  const options = {
    iso: [100, 200, 400, 800, 1600],
    aperture: ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4', 'f/5.6', 'f/8'],
    shutter: ['1/60s', '1/125s', '1/160s', '1/200s', '1/250s', '1/500s', '1/1000s']
  };
  
  const currentIndex = options[setting].indexOf(settings[setting]);
  if (currentIndex === -1) return;
  
  const newIndex = Math.max(0, Math.min(options[setting].length - 1, currentIndex + direction));
  settings[setting] = options[setting][newIndex];
  
  // Update the display
  // renderStylesGrid(); // No longer needed with static HTML
};

window.updateSetting = function(styleId, setting, value) {
  const settings = CAMERA_SETTINGS[styleId];
  if (!settings) return;
  
  settings[setting] = value;
  
  // Update the display
  // renderStylesGrid(); // No longer needed with static HTML
};

// Old renderStylesGrid function - now using static HTML
// function renderStylesGrid() {
//   // This function is no longer needed as we use static HTML
// }
// renderStylesGrid();

// Drag & Drop Upload Functionality
const controlsSection = document.querySelector('.controls');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  controlsSection.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  controlsSection.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  controlsSection.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  controlsSection.classList.add('drag-over');
}

function unhighlight(e) {
  controlsSection.classList.remove('drag-over');
}

controlsSection.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
    // Filter for images only
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // If we already have files, append the new ones
      if (uploadedProfiles.length > 0) {
        uploadedProfiles = [...uploadedProfiles, ...imageFiles];
      } else {
        uploadedProfiles = imageFiles;
      }
      
      // Reset primary index if only one image or first upload
      if (uploadedProfiles.length === 1) {
        primaryImageIndex = 0;
      } else if (primaryImageIndex >= uploadedProfiles.length) {
        primaryImageIndex = 0;
      }
      
      // Button text stays the same, no need to update
      
      // Show preview
      displayUploadedPreviews();
      
      console.log(`Total uploaded ${uploadedProfiles.length} profile images (dropped ${imageFiles.length} new ones)`);
    }
}

profilesInput.addEventListener("change", (e) => {
  const files = e.target.files;
  const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  
  // If we already have files, append the new ones
  if (uploadedProfiles.length > 0) {
    uploadedProfiles = [...uploadedProfiles, ...newFiles];
  } else {
    uploadedProfiles = newFiles;
  }
  
  console.log(`Total uploaded ${uploadedProfiles.length} profile images`);
  
  // Reset primary index if only one image or first upload
  if (uploadedProfiles.length === 1) {
    primaryImageIndex = 0;
  } else if (primaryImageIndex >= uploadedProfiles.length) {
    primaryImageIndex = 0;
  }
  
  // Button text stays the same, no need to update
  
  displayUploadedPreviews();
  updateClearUploadsButton();
});

// Style reference is now handled through the style reference card

// Update face mode selector to show/hide primary selection
function updateFaceModeUI() {
  const faceMode = document.querySelector('input[name="faceMode"]:checked').value;
  const previewTitle = uploadedPreviews.querySelector('.preview-title');
  
  if (faceMode === 'mix') {
    // When mixing, hide primary selection and show all images as equal
    if (previewTitle && uploadedProfiles.length > 1) {
      previewTitle.textContent = 'Uploaded Images (all will be blended together)';
    }
    
    // Remove primary selection styling from all images
    const allCards = uploadedPreviews.querySelectorAll('.preview-card');
    allCards.forEach(card => {
      card.classList.remove('primary-selected');
      card.classList.remove('non-selected'); // Remove fade class
    });
    
    // Update labels to remove stars but keep consistent numbering
    const allLabels = uploadedPreviews.querySelectorAll('.preview-label');
    allLabels.forEach((label, idx) => {
      // Only update if it's a profile label (not style ref)
      if (label.textContent.includes('Profile')) {
        label.textContent = `Profile ${idx + 1}`;
      }
    });
    
  } else {
    // When preserving primary, show selection interface
    if (previewTitle && uploadedProfiles.length > 1) {
      previewTitle.textContent = 'Uploaded Images (click to select primary face)';
    }
    
    // Re-apply primary selection styling without regenerating everything
    const allCards = uploadedPreviews.querySelectorAll('.preview-card');
    allCards.forEach((card, idx) => {
      const label = card.querySelector('.preview-label');
      
      // Only update profile cards, not style ref cards
      if (label && label.textContent.includes('Profile')) {
        if (idx === primaryImageIndex) {
          card.classList.add('primary-selected');
          card.classList.remove('non-selected'); // Remove fade class
          label.textContent = `Profile ${idx + 1} ⭐`;
        } else {
          card.classList.remove('primary-selected');
          card.classList.add('non-selected'); // Add fade class
          label.textContent = `Profile ${idx + 1}`;
        }
      }
    });
  }
}

// Add event listeners to face mode radio buttons
document.addEventListener('DOMContentLoaded', () => {
  const faceModeInputs = document.querySelectorAll('input[name="faceMode"]');
  faceModeInputs.forEach(input => {
    input.addEventListener('change', updateFaceModeUI);
  });
  
  // Add info button functionality
  const infoBtn = document.getElementById('faceModeInfoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', showFaceModeInfo);
  }
  
  // Initialize UI state
  updateClearUploadsButton();
  displayUploadedPreviews();
  updateCostEstimation();
});

// Show face mode information modal
function showFaceModeInfo() {
  const modal = document.createElement('div');
  modal.className = 'info-modal';
  modal.innerHTML = `
    <div class="info-modal-content">
      <div class="info-modal-header">
        <h3>Face Composition Modes Explained</h3>
        <button class="info-modal-close">×</button>
      </div>
      <div class="info-modal-body">
        <div class="info-section">
          <h4>👤 Use One Selected Image</h4>
          <p><strong>How it works:</strong> Only the image you select (marked with ⭐) will be used for generation. Other uploaded images will be ignored.</p>
          <p><strong>Best for:</strong> When you want to generate variations of a specific person's photo in different styles.</p>
          <p><strong>Result:</strong> All generated images will show the same person from the selected image.</p>
        </div>
        
        <div class="info-section">
          <h4>🎭 Mix All Faces</h4>
          <p><strong>How it works:</strong> The AI will blend facial features from ALL uploaded images to create a composite face.</p>
          <p><strong>Best for:</strong> Creating an "average" or "combination" of multiple faces.</p>
          <p><strong>Result:</strong> A unique face that combines features from all your uploaded images.</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal functionality
  const closeBtn = modal.querySelector('.info-modal-close');
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Clear uploads functionality
clearUploadsBtn.addEventListener("click", () => {
  // Reset all upload state
  uploadedProfiles = [];
  uploadedStyleRef = null;
  primaryImageIndex = 0;
  
  // Clear file inputs
  profilesInput.value = '';
  
  // Button text stays the same, no need to update
  
  // Clear previews
  uploadedPreviews.innerHTML = '';
  
  // Re-render styles grid to update style ref card
  // renderStylesGrid(); // No longer needed with static HTML
  
  // Update clear uploads button visibility
  updateClearUploadsButton();
  
  console.log("All uploads cleared");
});

// Function to update clear uploads button visibility
function updateClearUploadsButton() {
  if (uploadedProfiles.length > 0 || uploadedStyleRef) {
    clearUploadsBtn.style.display = 'block';
  } else {
    clearUploadsBtn.style.display = 'none';
  }
}

// Function to update primary selection without re-rendering all images
function updatePrimarySelection() {
  const previewCards = uploadedPreviews.querySelectorAll('.preview-card');
  
  previewCards.forEach((card) => {
    const label = card.querySelector('.preview-label');
    
    if (label) {
      // Extract the image index from the label text (e.g., "Profile 2" -> index 1)
      const match = label.textContent.match(/Profile (\d+)/);
      if (match) {
        const imageIndex = parseInt(match[1]) - 1; // Convert to 0-based index
        
        if (imageIndex === primaryImageIndex) {
          label.textContent = `Profile ${imageIndex + 1} ⭐ (will be used)`;
          card.classList.add('primary-selected');
        } else {
          label.textContent = `Profile ${imageIndex + 1}`;
          card.classList.remove('primary-selected');
        }
      }
    }
  });
  
  // Update face mode UI
  updateFaceModeUI();
}

// Function to update cost estimation
async function updateCostEstimation() {
  try {
    const selectedStylesArray = Array.from(selectedStyles);
    
    if (selectedStylesArray.length === 0) {
      costEstimation.style.display = 'none';
      return;
    }
    
    const response = await fetch('/api/estimate-cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedStyles: selectedStylesArray })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get cost estimation');
    }
    
    const data = await response.json();
    
    // Update the cost display
    costAmount.textContent = `$${data.costUSD.toFixed(2)}`;
    costSek.textContent = `${Math.round(data.costSEK)} SEK`;
    
    // Show the cost estimation
    costEstimation.style.display = 'block';
    
  } catch (error) {
    console.error('Error updating cost estimation:', error);
    costEstimation.style.display = 'none';
  }
}

// Clear headshots functionality
clearHeadshotsBtn.addEventListener("click", () => {
  // Clear results
  resultsGrid.innerHTML = '';
  generatedResults = [];
  
  // Hide results section
  resultsSection.style.display = 'none';
});

function displayUploadedPreviews() {
  uploadedPreviews.innerHTML = '';
  
  // Always show the upload section
  const previewTitle = document.createElement('h3');
  previewTitle.className = 'preview-title';
  if (uploadedProfiles.length === 0) {
    previewTitle.textContent = 'Upload Your Images';
  } else if (uploadedProfiles.length > 1) {
    previewTitle.textContent = 'Uploaded Images (click to select primary face)';
  } else {
    previewTitle.textContent = 'Uploaded Images';
  }
  uploadedPreviews.appendChild(previewTitle);
  
  const previewGrid = document.createElement('div');
  previewGrid.className = 'preview-grid';
  
  // Show empty upload frame if no images
  if (uploadedProfiles.length === 0) {
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
  }
  
  // Show profile images (clickable to select primary, but doesn't change order)
  const imagePromises = uploadedProfiles.map((file, idx) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgCard = document.createElement('div');
        imgCard.className = 'preview-card';
        
        // Add clickable class if multiple images
        if (uploadedProfiles.length > 1) {
          imgCard.classList.add('clickable');
        }
        
        // Add primary-selected class if this is the primary image
        if (idx === primaryImageIndex) {
          imgCard.classList.add('primary-selected');
        }
        
        imgCard.innerHTML = `
          <img src="${e.target.result}" alt="Profile ${idx + 1}">
          <p class="preview-label">Profile ${idx + 1}${idx === primaryImageIndex ? ' ⭐' : ''}</p>
        `;
        
        // Store the actual image index as a data attribute
        imgCard.setAttribute('data-image-index', idx);
        
        // Make clickable if multiple images (to select primary, not reorder)
        if (uploadedProfiles.length > 1) {
          imgCard.addEventListener('click', (function(capturedIdx) {
            return function() {
              primaryImageIndex = capturedIdx;
              updatePrimarySelection(); // Update selection without re-rendering
            };
          })(idx));
        }
        
        previewGrid.appendChild(imgCard);
        resolve({ imgCard, idx });
      };
      reader.readAsDataURL(file);
    });
  });
  
  // Wait for all images to load, then ensure correct order
  Promise.all(imagePromises).then((results) => {
    // Only clear and reorder if there are actual images
    if (results.length > 0) {
      // Sort the preview grid to match the original array order
      const sortedCards = results.sort((a, b) => a.idx - b.idx);
      previewGrid.innerHTML = '';
      sortedCards.forEach(({ imgCard }) => {
        previewGrid.appendChild(imgCard);
      });
    }
    // If results.length === 0, keep the empty frame that was already added
  });
  
  // Show style reference if present
  if (uploadedStyleRef) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const refCard = document.createElement('div');
      refCard.className = 'preview-card style-ref-preview';
      refCard.innerHTML = `
        <img src="${e.target.result}" alt="Style Reference">
        <p class="preview-label">Style Reference</p>
      `;
      previewGrid.appendChild(refCard);
    };
    reader.readAsDataURL(uploadedStyleRef);
  }
  
  uploadedPreviews.appendChild(previewGrid);
  
  // Update face mode UI after rendering
  updateFaceModeUI();
}

generateBtn.addEventListener("click", async () => {
  if (!uploadedProfiles.length) {
    alert("Please upload at least one profile image.");
    return;
  }
  
  if (!selectedStyles.size) {
    alert("Please select at least one style from the grid.");
    return;
  }

  // Show progress tracking
  showProgressTracking(Array.from(selectedStyles));
  // Scroll progress into view
  setTimeout(() => {
    progressContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);

  try {
    const formData = new FormData();
    uploadedProfiles.forEach(f => formData.append("profiles", f));
    if (uploadedStyleRef) formData.append("styleRef", uploadedStyleRef);
    formData.append("styles", JSON.stringify(Array.from(selectedStyles)));
    formData.append("primaryImageIndex", primaryImageIndex);
    
    // Debug: Log the image order and primary selection
    console.log(`🔍 DEBUG: Primary image index: ${primaryImageIndex}`);
    console.log(`🔍 DEBUG: Total images: ${uploadedProfiles.length}`);
    uploadedProfiles.forEach((file, idx) => {
      console.log(`🔍 DEBUG: Image ${idx}: ${file.name} (${idx === primaryImageIndex ? 'PRIMARY' : 'secondary'})`);
    });
    
    // Get face mode from radio buttons
    const faceMode = document.querySelector('input[name="faceMode"]:checked').value;
    formData.append("mixFaces", faceMode === "mix");

    const res = await fetch("http://localhost:3000/generate-stream", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              updateProgressItem(data.styleId, 'generating');
            } else if (data.type === 'result') {
              addResult(data.styleId, data.styleName, data.imageUrl);
              updateProgressItem(data.styleId, 'complete', data.imageUrl);
            } else if (data.type === 'error') {
              updateProgressItem(data.styleId, 'error');
              console.error(`Error generating ${data.styleId}:`, data.error);
            } else if (data.type === 'complete') {
              updateProgressItem(data.styleId, 'complete');
            } else if (data.type === 'done') {
              // All generation complete
              console.log("All styles generated successfully");
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Generation failed:", error);
    alert(`Generation failed: ${error.message}`);
  }
});

function showProgressTracking(styleIds) {
  progressContainer.style.display = 'block';
  progressContainer.innerHTML = `
    <h3 style="text-align: center; margin-bottom: 20px; font-family: 'Caveat', cursive; font-size: 24px;">✨ Generating Your Headshots</h3>
    <div class="progress-grid">
      ${styleIds.map(styleId => `
        <div class="progress-item pending" data-style="${styleId}">
          <div class="progress-icon">⏳</div>
          <div class="progress-text">${STYLES.find(s => s.id === styleId)?.title || styleId}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function updateProgressItem(styleId, status, imageUrl = null) {
  const item = progressContainer.querySelector(`[data-style="${styleId}"]`);
  if (!item) return;

  item.className = `progress-item ${status}`;
  
  if (status === 'generating') {
    item.querySelector('.progress-icon').textContent = '🎨';
    item.querySelector('.progress-text').textContent = `Generating ${STYLES.find(s => s.id === styleId)?.title || styleId}...`;
  } else if (status === 'complete') {
    item.querySelector('.progress-icon').textContent = '✅';
    item.querySelector('.progress-text').textContent = `${STYLES.find(s => s.id === styleId)?.title || styleId} Complete`;
    
    if (imageUrl) {
      const miniPreview = document.createElement('div');
      miniPreview.className = 'mini-preview';
      miniPreview.innerHTML = `<img src="${imageUrl}" alt="Preview">`;
      item.appendChild(miniPreview);
    }
  } else if (status === 'error') {
    item.querySelector('.progress-icon').textContent = '❌';
    item.querySelector('.progress-text').textContent = `${STYLES.find(s => s.id === styleId)?.title || styleId} Failed`;
  }
}

function addResult(styleId, styleName, imageUrl) {
  const resultItem = document.createElement('div');
  resultItem.className = 'result-item polaroid-developing';
  
  resultItem.innerHTML = `
    <img src="${imageUrl}" alt="${styleName}">
    <div class="result-caption">
      <span>${styleName}</span>
      <button class="btn btn-small" onclick="downloadImage('${imageUrl}', '${styleName.replace(/[^a-zA-Z0-9]/g, '_')}.png')">💾 Save</button>
    </div>
  `;
  
  resultsGrid.appendChild(resultItem);
  generatedResults.push({ styleId, styleName, imageUrl });
  
  // Show results section and scroll to it when first result is added
  if (generatedResults.length === 1) {
    resultsSection.style.display = 'block';
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }
  
  // Trigger polaroid development animation
  setTimeout(() => {
    resultItem.classList.remove('polaroid-developing');
    resultItem.classList.add('polaroid-developed');
  }, 100);
}

window.downloadImage = async function(imageUrl, filename) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create a blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading image:', error);
    alert('Failed to download image. Please try again.');
  }
}

// Download all functionality
function downloadAll() {
  if (generatedResults.length === 0) {
    alert("No results to download yet!");
    return;
  }
  
  generatedResults.forEach((result, index) => {
    setTimeout(() => {
      downloadImage(result.imageUrl, `${result.styleName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    }, index * 200); // Stagger downloads
  });
}

// Add download all button after generation
function addDownloadAllButton() {
  const existingContainer = document.querySelector('.download-all-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.className = 'download-all-container';
  container.innerHTML = `
    <button class="btn btn-primary" onclick="downloadAll()">📦 Download All Results</button>
    <span style="color: var(--muted); font-size: 14px;">Downloads all ${generatedResults.length} generated images</span>
  `;
  
  resultsGrid.parentNode.insertBefore(container, resultsGrid.nextSibling);
}

// New Style System JavaScript
function initializeStyleSystem() {
  const root = document.getElementById('styles');
  if (!root) return;

  function syncBindings(card) {
    const data = readState(card);
    const isoElement = card.querySelector('[data-bind="iso"]');
    const apertureElement = card.querySelector('[data-bind="aperture"]');
    const shutterElement = card.querySelector('[data-bind="shutter"]');
    const lightingElement = card.querySelector('[data-bind="lighting"]');
    
    if (isoElement) isoElement.textContent = data.iso;
    if (apertureElement) apertureElement.textContent = data.aperture;
    if (shutterElement) shutterElement.textContent = data.shutter;
    if (lightingElement) lightingElement.textContent = data.lighting;
  }

  function readState(card) {
    return {
      styleId: card.dataset.styleId,
      camera: card.dataset.camera,
      lens: card.dataset.lens,
      iso: card.dataset.iso,
      aperture: card.dataset.aperture,
      shutter: card.dataset.shutter,
      lighting: card.dataset.lighting
    };
  }

  function writeState(card, patch) {
    Object.entries(patch).forEach(([k, v]) => { 
      card.dataset[k] = v; 
    });
    syncBindings(card);
    root.dispatchEvent(new CustomEvent('style-change', { 
      detail: { card, state: readState(card) } 
    }));
  }

  root.addEventListener('click', e => {
    const advBtn = e.target.closest('.style-adv');
    if (advBtn) {
      const card = e.target.closest('.style-card');
      const panel = card.querySelector('.adv-panel');
      const isOpen = !panel.hasAttribute('hidden');
      
      if (isOpen) { 
        panel.setAttribute('hidden', ''); 
        advBtn.setAttribute('aria-expanded', 'false');
        advBtn.querySelector('span').textContent = '⚙️ Avancerat';
      } else { 
        panel.removeAttribute('hidden'); 
        advBtn.setAttribute('aria-expanded', 'true');
        advBtn.querySelector('span').textContent = '⚙️ Dölj';
      }
      return;
    }

    const chip = e.target.closest('.chip');
    if (chip) {
      const card = e.target.closest('.style-card');
      const wrap = chip.parentElement;
      wrap.querySelectorAll('.chip').forEach(c => 
        c.classList.toggle('is-active', c === chip)
      );
      writeState(card, { lighting: chip.dataset.value });
      return;
    }

    const reset = e.target.closest('.btn-reset');
    if (reset) {
      const card = e.target.closest('.style-card');
      const originalData = {
        camera: card.getAttribute('data-camera'),
        lens: card.getAttribute('data-lens'),
        iso: card.getAttribute('data-iso'),
        aperture: card.getAttribute('data-aperture'),
        shutter: card.getAttribute('data-shutter'),
        lighting: card.getAttribute('data-lighting')
      };
      
      writeState(card, originalData);
      
      // Reset form elements
      const selects = card.querySelectorAll('[data-input]');
      selects.forEach(el => {
        const key = el.getAttribute('data-input');
        if (el.tagName === 'SELECT') {
          el.value = card.dataset[key];
        }
        if (key === 'lighting') {
          card.querySelectorAll('.chip').forEach(c => 
            c.classList.toggle('is-active', c.dataset.value === card.dataset.lighting)
          );
        }
      });
      return;
    }
  });

  root.addEventListener('change', e => {
    const sel = e.target.closest('[data-input]');
    if (!sel) return;
    const card = e.target.closest('.style-card');
    const key = sel.getAttribute('data-input');
    if (key === 'lighting') return;
    writeState(card, { [key]: sel.value });
  });

  // Initial sync
  document.querySelectorAll('.style-card').forEach(syncBindings);
}

// Year Settings JavaScript
function initializeYearSettings() {
  const yearSlider = document.getElementById('yearSlider');
  const yearValue = document.getElementById('yearValue');
  const yearHand = document.getElementById('yearHand');
  const yearPresets = document.querySelectorAll('.year-preset');
  
  if (!yearSlider || !yearValue || !yearHand) return;

  function updateYearDisplay(year) {
    yearValue.textContent = year;
    
    // Calculate rotation for clock hand (0-360 degrees for 1950-2030)
    const minYear = 1950;
    const maxYear = 2030;
    const rotation = ((year - minYear) / (maxYear - minYear)) * 360;
    yearHand.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
    
    // Update active preset
    yearPresets.forEach(preset => {
      preset.classList.toggle('active', preset.dataset.year == year);
    });
    
    // Dispatch year change event
    document.dispatchEvent(new CustomEvent('year-change', { 
      detail: { year: parseInt(year) } 
    }));
  }

  yearSlider.addEventListener('input', (e) => {
    updateYearDisplay(e.target.value);
  });

  yearPresets.forEach(preset => {
    preset.addEventListener('click', () => {
      const year = preset.dataset.year;
      yearSlider.value = year;
      updateYearDisplay(year);
    });
  });

  // Initialize with default value
  updateYearDisplay(yearSlider.value);
}

// Style Reference JavaScript
function initializeStyleReference() {
  const styleRefInput = document.getElementById('styleRefInput');
  const styleRefPreview = document.getElementById('styleRefPreview');
  
  if (!styleRefInput || !styleRefPreview) return;

  styleRefPreview.addEventListener('click', () => {
    styleRefInput.click();
  });

  styleRefInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      styleRefPreview.innerHTML = `
        <img src="${e.target.result}" alt="Style reference" 
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
      `;
      
      // Dispatch style reference change event
      document.dispatchEvent(new CustomEvent('style-ref-change', { 
        detail: { file, dataUrl: e.target.result } 
      }));
    };
    reader.readAsDataURL(file);
  });
}

// Initialize the new systems
document.addEventListener('DOMContentLoaded', () => {
  // Initialize existing systems
  displayUploadedPreviews();
  updateClearUploadsButton();
  updateCostEstimation();
  
  // Initialize new style system
  initializeStyleSystem();
  initializeYearSettings();
  initializeStyleReference();
});