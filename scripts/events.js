// events.js - Event handling setup
function initializeEventListeners() {
    const addSnippetButton = document.getElementById('add-snippet');
    const titleInput = document.getElementById('title-input');
    const snippetInput = document.getElementById('snippet-input');
    const searchInput = document.getElementById('search-input');
    const captureButton = document.getElementById('capture-screenshot');

    addSnippetButton.addEventListener('click', function() {
        const titleText = titleInput.value.trim();
        const snippetText = snippetInput.value.trim();
        if (titleText && snippetText) {
            checkForDuplicateTitle(titleText, function(isDuplicate) {
                if (isDuplicate) {
                    showAlert('A snippet with this title already exists.');
                } else {
                    addSnippetToDOM(titleText, snippetText);
                    saveSnippet(titleText, snippetText);
                    titleInput.value = '';
                    snippetInput.value = '';
                }
            });
        }
    });

    captureButton.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 }, async (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error('Screenshot failed:', chrome.runtime.lastError);
                    showAlert('Failed to capture screenshot.');
                    return;
                }

                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => img.onload = resolve);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const aspectRatio = img.width / img.height;
                const thumbWidth = 300;
                const thumbHeight = thumbWidth / aspectRatio;
                
                canvas.width = thumbWidth;
                canvas.height = thumbHeight;
                
                ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
                
                const thumbnailDataUrl = canvas.toDataURL('image/png', 0.8);
                
                const title = `Screenshot ${new Date().toLocaleString()}`;
                
                saveScreenshot(title, {
                    original: dataUrl,
                    thumbnail: thumbnailDataUrl
                });
            });
        } catch (err) {
            console.error('Error capturing screenshot:', err);
            showAlert('Failed to capture screenshot.');
        }
    });

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const snippets = document.querySelectorAll('#snippet-list li');
        snippets.forEach(snippet => {
            const title = snippet.querySelector('h3').textContent.toLowerCase();
            snippet.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    snippetInput.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = snippetInput.selectionStart;
            const end = snippetInput.selectionEnd;
            const tab = '   ';
            snippetInput.value = snippetInput.value.substring(0, start) + tab + snippetInput.value.substring(end);
            snippetInput.selectionStart = snippetInput.selectionEnd = start + tab.length;
        }
    });
}