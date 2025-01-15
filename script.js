document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const settingsPanel = document.getElementById('settingsPanel');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const processButton = document.getElementById('processButton');
    const resetButton = document.getElementById('resetButton');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const imagePreviews = document.getElementById('imagePreviews');
    const bgType = document.getElementById('bgType');
    let selectedFiles = [];

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.onchange = function(e) {
        console.log('File input change event triggered');
        handleFiles(this.files);
    };

    // Update quality value display
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });

    bgType.addEventListener('change', function() {
        document.querySelector('.color-picker-wrapper').style.display = 
            this.value === 'color' ? 'inline-flex' : 'none';
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    function handleDrop(e) {
        console.log('Drop event triggered');
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }

    function handleFiles(files) {
        console.log('Files received:', files); // Debug log
        selectedFiles = [...files];
        console.log('Selected files:', selectedFiles);
        if (selectedFiles.length > 0) {
            settingsPanel.style.display = 'block';
            dropZone.style.display = 'none';
            document.querySelector('.features').style.display = 'none';
            displayPreviews(selectedFiles);
        }
    }

    function displayPreviews(files) {
        console.log('Displaying previews for:', files); // Debug log
        imagePreviews.innerHTML = '';
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'image-preview';
                div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                imagePreviews.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }

    processButton.addEventListener('click', async () => {
        const scale = document.getElementById('scalePercentage').value / 100;
        const format = document.getElementById('imageFormat').value;
        const quality = document.getElementById('qualitySlider').value / 100;

        progressBar.style.display = 'block';
        processButton.disabled = true;

        try {
            const zip = new JSZip();
            let processed = 0;

            for (const file of selectedFiles) {
                const resizedImage = await resizeImage(file, scale, format, quality);
                const fileName = `resized-${file.name.split('.')[0]}.${format}`;
                
                // Convert base64 to blob
                const base64Data = resizedImage.split(',')[1];
                const blob = await fetch(resizedImage).then(res => res.blob());
                
                zip.file(fileName, blob);
                
                processed++;
                const percentComplete = (processed / selectedFiles.length) * 100;
                progress.style.width = `${percentComplete}%`;
                progressText.textContent = `Processing: ${Math.round(percentComplete)}%`;
            }

            // Generate and download zip file
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'resized-images.zip');

            // Show reset button
            processButton.style.display = 'none';
            resetButton.style.display = 'block';
            progressText.textContent = 'Processing complete!';

        } catch (error) {
            console.error('Error processing images:', error);
            progressText.textContent = 'Error processing images!';
        }
    });

    resetButton.addEventListener('click', () => {
        // Reset the UI
        settingsPanel.style.display = 'none';
        dropZone.style.display = 'block';
        progressBar.style.display = 'none';
        progress.style.width = '0%';
        progressText.textContent = 'Processing: 0%';
        processButton.style.display = 'block';
        processButton.disabled = false;
        resetButton.style.display = 'none';
        selectedFiles = [];
        imagePreviews.innerHTML = '';
    });

    async function resizeImage(file, scale, format, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = function(e) {
                img.src = e.target.result;
            };

            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const newWidth = Math.round(img.width * scale);
                const newHeight = Math.round(img.height * scale);

                canvas.width = newWidth;
                canvas.height = newHeight;

                // Only fill background if white is selected
                if (bgType.value === 'white') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw image
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                // Convert to desired format
                const mimeType = `image/${format}`;
                resolve(canvas.toDataURL(mimeType, quality));
            };

            reader.readAsDataURL(file);
        });
    }
}); 