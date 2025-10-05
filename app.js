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
// Profile label is now part of the button, no separate element needed
const clearUploadsBtn = document.getElementById("clearUploadsBtn");

let selectedStyles = new Set(['basic']); // Start with Basic selected by default
let uploadedProfiles = [];
let uploadedStyleRef = null;
let primaryImageIndex = 0; // Track which image preserves facial features
let generatedResults = []; // Store generated results for batch download

// Render style grid with style reference card
function renderStylesGrid() {
  stylesGrid.innerHTML = "";
  
  // Add style reference card first
  const styleRefCard = document.createElement("div");
  styleRefCard.className = "style-ref-card";
  if (uploadedStyleRef) {
    styleRefCard.classList.add("has-ref");
  }
  
  const refTitle = uploadedStyleRef ? `🎨 Style Ref: ${uploadedStyleRef.name}` : "🎨 Your Own Style (Optional)";
  const refDesc = uploadedStyleRef ? "Click to change or remove" : "Upload a reference image to apply its style to all generated headshots";
  
  styleRefCard.innerHTML = `<p class="style-title">${refTitle}</p><p class="style-sub">${refDesc}</p>`;
  
  styleRefCard.addEventListener("click", () => {
    if (uploadedStyleRef) {
      // Clear existing style ref
      uploadedStyleRef = null;
      renderStylesGrid();
      displayUploadedPreviews();
    } else {
      // Create a temporary file input for style reference
      const tempInput = document.createElement('input');
      tempInput.type = 'file';
      tempInput.accept = 'image/*';
      tempInput.style.display = 'none';
      tempInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          uploadedStyleRef = file;
          console.log(`Style reference uploaded: ${file.name}`);
          renderStylesGrid();
          displayUploadedPreviews();
        }
        document.body.removeChild(tempInput);
      });
      document.body.appendChild(tempInput);
      tempInput.click();
    }
  });
  
  stylesGrid.appendChild(styleRefCard);
  
  // Add regular style cards
  STYLES.forEach(style => {
    const card = document.createElement("div");
    card.className = "style-card";
    if (selectedStyles.has(style.id)) card.classList.add("selected");
    card.innerHTML = `<p class="style-title">${style.title}</p><p class="style-sub">${style.desc}</p>`;
    card.addEventListener("click", () => {
      if (selectedStyles.has(style.id)) {
        selectedStyles.delete(style.id);
      } else {
        selectedStyles.add(style.id);
      }
      renderStylesGrid();
    });
    stylesGrid.appendChild(card);
  });
}
renderStylesGrid();

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
  renderStylesGrid();
  
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
  uploadedProfiles.forEach((file, idx) => {
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
      
      // Make clickable if multiple images (to select primary, not reorder)
      if (uploadedProfiles.length > 1) {
        imgCard.addEventListener('click', () => {
          primaryImageIndex = idx;
          displayUploadedPreviews(); // Re-render to show selection
        });
      }
      
      previewGrid.appendChild(imgCard);
    };
    reader.readAsDataURL(file);
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