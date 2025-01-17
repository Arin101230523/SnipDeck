function saveScreenshot(title, { original, thumbnail }) {
    getFromStorage('screenshots', screenshots => {
        screenshots = screenshots || [];
        screenshots.push({ 
            title, 
            dataUrl: original,
            thumbnailUrl: thumbnail,
            timestamp: Date.now() 
        });
        saveToStorage('screenshots', screenshots);
        addScreenshotToDOM(title, thumbnail, original);
    });
}

function addScreenshotToDOM(title, thumbnailUrl, originalUrl) {
    const li = document.createElement('li');
    li.className = 'screenshot-item';
    
    const img = document.createElement('img');
    img.className = 'screenshot-thumbnail';
    img.src = thumbnailUrl;
    img.alt = title;
    
    // Create a div for title with an event listener for click to become editable
    const titleElem = document.createElement('div');
    titleElem.className = 'screenshot-title';
    titleElem.textContent = title;
    
    // When the title is clicked, turn it into an editable input field
    titleElem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.className = 'screenshot-title-input';
        input.value = titleElem.textContent;
        
        // Replace the title text with input field
        titleElem.replaceWith(input);
        
        // Focus on the input for immediate editing
        input.focus();
        
        // Save the new title when the input field loses focus or Enter is pressed
        input.addEventListener('blur', () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== titleElem.textContent) {
                updateScreenshotTitle(titleElem.textContent, originalUrl, newTitle);
            }
            // Replace input with updated static title
            input.replaceWith(titleElem);
            titleElem.textContent = newTitle;
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger blur when Enter is pressed
            }
        });
    });

    const actions = document.createElement('div');
    actions.className = 'screenshot-actions';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'scopy-button';
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        copyImageToClipboard(originalUrl).then(() => {
            showCopyPopup(copyButton);
        }).catch(err => {
            console.error('Copy failed:', err);
            showAlert('Failed to copy image to clipboard.');
        });
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteScreenshot(title, originalUrl);
        li.remove();
    });
    
    actions.appendChild(copyButton);
    actions.appendChild(deleteButton);
    
    li.appendChild(img);
    li.appendChild(titleElem); // Append the title div initially
    li.appendChild(actions);
    
    img.addEventListener('click', () => {
        copyImageToClipboard(originalUrl).then(() => {
            showCopyPopup(copyButton);
        }).catch(err => {
            console.error('Copy failed:', err);
            showAlert('Failed to copy image to clipboard.');
        });
    });
    
    document.querySelector('#screenshot-list').appendChild(li);
}

function updateScreenshotTitle(oldTitle, originalUrl, newTitle) {
    getFromStorage('screenshots', screenshots => {
        screenshots = screenshots || [];
        const screenshot = screenshots.find(s => s.title === oldTitle && s.dataUrl === originalUrl);
        if (screenshot) {
            screenshot.title = newTitle;
            saveToStorage('screenshots', screenshots);
        }
    });
}

async function copyImageToClipboard(dataUrl) {
    try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => img.onload = resolve);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const pngDataUrl = canvas.toDataURL('image/png');

        const response = await fetch(pngDataUrl);
        const blob = await response.blob();
        const clipboardItem = new ClipboardItem({
            'image/png': blob
        });
        await navigator.clipboard.write([clipboardItem]);
        console.log('Image copied successfully');
    } catch (err) {
        console.error('Failed to copy image:', err);
        
        try {
            const img = document.createElement('img');
            img.src = dataUrl;
            document.body.appendChild(img);
            
            const range = document.createRange();
            range.selectNode(img);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Copy command failed');
            }
            
            document.body.removeChild(img);
            console.log('Image copied using fallback method');
        } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr);
            showAlert('Failed to copy image to clipboard.');
            throw fallbackErr;
        }
    }
}

function deleteScreenshot(title, dataUrl) {
    getFromStorage('screenshots', screenshots => {
        screenshots = screenshots || [];
        const index = screenshots.findIndex(s => s.title === title && s.dataUrl === dataUrl);
        if (index > -1) {
            screenshots.splice(index, 1);
            saveToStorage('screenshots', screenshots);
        }
    });
}