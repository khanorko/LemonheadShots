// AI Headshot Generator — Gemini 2.5 Flash Image API

const STYLES = [
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
const styleRefInput = document.getElementById("styleRefInput");
const aspectSelect = document.getElementById("aspectSelect");
const mixFacesCheck = document.getElementById("mixFacesCheck");
const generateBtn = document.getElementById("generateBtn");
const stylesGrid = document.getElementById("stylesGrid");
const resultsGrid = document.getElementById("resultsGrid");
const uploadedPreviews = document.getElementById("uploadedPreviews");
const progressContainer = document.getElementById("progressContainer");
const profileLabel = document.getElementById("profileLabel");
const styleRefLabel = document.getElementById("styleRefLabel");

let selectedStyles = new Set();
let uploadedProfiles = [];
let uploadedStyleRef = null;
let primaryImageIndex = 0; // Track which image preserves facial features
let generatedResults = []; // Store generated results for batch download

// Render style grid
function renderStylesGrid() {
  stylesGrid.innerHTML = "";
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
const controlsSection = document.querySelector('.gen-controls');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  controlsSection.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  controlsSection.addEventListener(eventName, () => {
    controlsSection.classList.add('drag-over');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  controlsSection.addEventListener(eventName, () => {
    controlsSection.classList.remove('drag-over');
  }, false);
});

controlsSection.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    // Filter for images only
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      uploadedProfiles = imageFiles;
      primaryImageIndex = 0;
      
      // Update label
      profileLabel.textContent = `📷 ${imageFiles.length} Profile Image${imageFiles.length > 1 ? 's' : ''} Selected`;
      profileLabel.style.color = 'var(--accent)';
      
      // Show preview
      displayUploadedPreviews();
      
      console.log(`Dropped ${imageFiles.length} image(s)`);
    }
  }
}

profilesInput.addEventListener("change", (e) => {
  uploadedProfiles = Array.from(e.target.files || []);
  console.log(`Uploaded ${uploadedProfiles.length} profile images`);
  
  // Reset primary index if only one image or first upload
  if (uploadedProfiles.length === 1) {
    primaryImageIndex = 0;
  } else if (primaryImageIndex >= uploadedProfiles.length) {
    primaryImageIndex = 0;
  }
  
  // Update label with count
  if (uploadedProfiles.length > 0) {
    profileLabel.textContent = `📷 ${uploadedProfiles.length} Profile Image${uploadedProfiles.length > 1 ? 's' : ''} Selected`;
    profileLabel.style.color = 'var(--accent)';
  } else {
    profileLabel.textContent = '📷 Upload Profile Images (multi)';
    profileLabel.style.color = '';
  }
  
  // Show preview thumbnails
  displayUploadedPreviews();
});

styleRefInput.addEventListener("change", (e) => {
  uploadedStyleRef = e.target.files && e.target.files[0];
  console.log("Style reference uploaded:", uploadedStyleRef?.name);
  
  // Update label
  if (uploadedStyleRef) {
    styleRefLabel.textContent = `🎨 Style Ref: ${uploadedStyleRef.name}`;
    styleRefLabel.style.color = 'var(--accent-2)';
  } else {
    styleRefLabel.textContent = '🎨 Style Reference (optional)';
    styleRefLabel.style.color = '';
  }
  
  // Refresh previews to show style ref
  displayUploadedPreviews();
});

function displayUploadedPreviews() {
  uploadedPreviews.innerHTML = '';
  
  if (uploadedProfiles.length === 0 && !uploadedStyleRef) {
    return;
  }
  
  const previewTitle = document.createElement('h3');
  previewTitle.className = 'preview-title';
  if (uploadedProfiles.length > 1) {
    previewTitle.textContent = 'Uploaded Images (click to preserve facial features)';
  } else {
    previewTitle.textContent = 'Uploaded Images';
  }
  uploadedPreviews.appendChild(previewTitle);
  
  const previewGrid = document.createElement('div');
  previewGrid.className = 'preview-grid';
  
  // Show profile images (clickable to select primary)
  uploadedProfiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgCard = document.createElement('div');
      imgCard.className = 'preview-card';
      
      // Add clickable class if multiple images
      if (uploadedProfiles.length > 1) {
        imgCard.classList.add('clickable');
      }
      
      if (idx === primaryImageIndex) {
        imgCard.classList.add('primary-selected');
      }
      
      imgCard.innerHTML = `
        <img src="${e.target.result}" alt="Profile ${idx + 1}">
        <p class="preview-label">Profile ${idx + 1}${idx === primaryImageIndex ? ' ⭐' : ''}</p>
      `;
      
      // Make clickable if multiple images
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
      const imgCard = document.createElement('div');
      imgCard.className = 'preview-card style-ref-preview';
      imgCard.innerHTML = `
        <img src="${e.target.result}" alt="Style Reference">
        <p class="preview-label">Style Ref</p>
      `;
      previewGrid.appendChild(imgCard);
    };
    reader.readAsDataURL(uploadedStyleRef);
  }
  
  uploadedPreviews.appendChild(previewGrid);
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

  generateBtn.disabled = true;
  generateBtn.textContent = "⏳ Generating...";
  resultsGrid.innerHTML = "";
  generatedResults = []; // Clear previous results
  
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
    formData.append("aspectRatio", aspectSelect.value);
    formData.append("primaryImageIndex", primaryImageIndex);
    formData.append("mixFaces", mixFacesCheck.checked);

    const res = await fetch("http://localhost:3000/generate-stream", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Generation failed");
    }

    // Stream results as they come in
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'progress') {
            updateProgress(data.styleId, 'generating');
          } else if (data.type === 'result') {
            updateProgress(data.styleId, 'complete');
            appendResult(data.result);
            // Scroll first result into view once
            if (generatedResults.length === 1) {
              setTimeout(() => {
                const first = resultsGrid.querySelector('.result-item');
                if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }
          } else if (data.type === 'error') {
            updateProgress(data.styleId, 'error', data.error);
            console.error(`Generation error for ${data.styleId}:`, data.error);
          }
        }
      }
    }
    
    // Hide progress after successful completion (but keep errors visible)
    const hasErrors = document.querySelector('.progress-item.error');
    if (!hasErrors) {
      setTimeout(() => {
        progressContainer.innerHTML = '';
      }, 3000);
    }
    
    // Show download all button only when multiple results
    if (generatedResults.length > 1) {
      showDownloadAllButton();
    }

  } catch (err) {
    console.error(err);
    resultsGrid.innerHTML = `<p style='color: #ff6b6b; grid-column: 1/-1; padding: 20px; text-align: center;'><strong>Error:</strong> ${err.message}</p>`;
    // Keep progress visible to show which styles failed
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "✨ Generate Styles";
  }
});

function showProgressTracking(styleIds) {
  progressContainer.innerHTML = '<h3 class="preview-title">Generation Progress</h3>';
  const progressGrid = document.createElement('div');
  progressGrid.className = 'progress-grid';
  progressGrid.id = 'progressGrid';
  
  styleIds.forEach(styleId => {
    const styleName = STYLES.find(s => s.id === styleId)?.title || styleId;
    const progressItem = document.createElement('div');
    progressItem.className = 'progress-item pending';
    progressItem.id = `progress-${styleId}`;
    progressItem.innerHTML = `
      <div class="progress-icon">⏳</div>
      <div class="progress-text">${styleName}</div>
    `;
    progressGrid.appendChild(progressItem);
  });
  
  progressContainer.appendChild(progressGrid);
}

function updateProgress(styleId, status, errorMsg) {
  const progressItem = document.getElementById(`progress-${styleId}`);
  if (!progressItem) return;
  
  progressItem.className = `progress-item ${status}`;
  
  if (status === 'generating') {
    progressItem.querySelector('.progress-icon').textContent = '🔄';
  } else if (status === 'complete') {
    progressItem.querySelector('.progress-icon').textContent = '✅';
    // Optional: add mini preview to completed progress item
    // (keeps progress and result connected visually)
    // Only add if not already added
    if (!progressItem.querySelector('.mini-preview') && generatedResults[generatedResults.length - 1]) {
      const last = generatedResults[generatedResults.length - 1];
      const mini = document.createElement('div');
      mini.className = 'mini-preview';
      mini.innerHTML = `<img src="${last.dataUrl}" alt="${last.style}">`;
      progressItem.appendChild(mini);
    }
  } else if (status === 'error') {
    progressItem.querySelector('.progress-icon').textContent = '❌';
    if (errorMsg) {
      progressItem.querySelector('.progress-text').textContent += ` - ${errorMsg}`;
    }
  }
}

function appendResult(item) {
  generatedResults.push(item); // Store for batch download
  
  const card = document.createElement("div");
  card.className = "result-item polaroid-developing";
  card.innerHTML = `
    <img src="${item.dataUrl}" alt="Generated ${item.style}">
    <div class="result-caption">
      <span>${item.style}</span>
      <button class="btn btn-small" onclick="downloadImage('${item.dataUrl}', 'style-${Date.now()}.png')">💾 Save</button>
    </div>
  `;
  resultsGrid.appendChild(card);
  
  // Trigger development animation
  setTimeout(() => {
    card.classList.remove('polaroid-developing');
    card.classList.add('polaroid-developed');
  }, 100);
}

function showDownloadAllButton() {
  // Check if button already exists
  if (document.getElementById('downloadAllBtn')) return;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'download-all-container';
  buttonContainer.innerHTML = `
    ${generatedResults.length > 1 ? `<button id="downloadAllBtn" class="btn btn-primary">📦 Download All (${generatedResults.length})</button>` : ''}
    <button id="clearAllBtn" class="btn btn-secondary">
      🗑️ Clear All
    </button>
  `;
  
  resultsGrid.parentElement.insertBefore(buttonContainer, resultsGrid);
  
  // Add event listeners
  const dl = document.getElementById('downloadAllBtn');
  if (dl) dl.addEventListener('click', downloadAllImages);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllResults);
}

function downloadAllImages() {
  generatedResults.forEach((item, idx) => {
    setTimeout(() => {
      const styleName = item.style.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadImage(item.dataUrl, `headshot_${styleName}_${idx + 1}.png`);
    }, idx * 200); // Stagger downloads
  });
}

function clearAllResults() {
  resultsGrid.innerHTML = '';
  generatedResults = [];
  const buttonContainer = document.querySelector('.download-all-container');
  if (buttonContainer) {
    buttonContainer.remove();
  }
}

function displayResults(results) {
  resultsGrid.innerHTML = "";
  if (!results.length) {
    resultsGrid.innerHTML = "<p style='color: var(--muted); grid-column: 1/-1;'>No results generated.</p>";
    return;
  }
  results.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "result-item";
    card.innerHTML = `
      <img src="${item.dataUrl}" alt="Generated ${item.style}">
      <div class="result-caption">
        <span>${item.style}</span>
        <button class="btn btn-primary" onclick="downloadImage('${item.dataUrl}', 'style-${idx}.png')">💾 Save</button>
      </div>
    `;
    resultsGrid.appendChild(card);
  });
}

window.downloadImage = (dataUrl, filename) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
};
