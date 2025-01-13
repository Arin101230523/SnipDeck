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
    
    const titleElem = document.createElement('div');
    titleElem.className = 'screenshot-title';
    titleElem.textContent = title;
    
    const actions = document.createElement('div');
    actions.className = 'screenshot-actions';
    
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
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
    li.appendChild(titleElem);
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

async function copyImageToClipboard(dataUrl) {
    try {
        const response = await fetch(dataUrl);
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