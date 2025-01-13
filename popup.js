document.addEventListener('DOMContentLoaded', function() {
    // Elements for snippets
    const addSnippetButton = document.getElementById('add-snippet');
    const titleInput = document.getElementById('title-input');
    const snippetInput = document.getElementById('snippet-input');
    const snippetList = document.getElementById('snippet-list');
    const searchInput = document.getElementById('search-input');

    // Elements for screenshots and tabs
    const tabs = document.querySelectorAll('.tab');
    const contentSections = document.querySelectorAll('.content-section');
    const captureButton = document.getElementById('capture-screenshot');
    const screenshotList = document.getElementById('screenshot-list');

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contentSections.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.content-section[data-tab="${tab.dataset.tab}"]`).classList.add('active');
        });
    });

    // Load selected text if available
    chrome.storage.local.get(['selectedText'], function(result) {
        if (result.selectedText) {
            snippetInput.value = result.selectedText;
            chrome.storage.local.remove('selectedText');
        }
    });

    // Load existing snippets
    chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        snippets.forEach(snippet => addSnippetToDOM(snippet.title, snippet.text));
    });

    // Load existing screenshots
    chrome.storage.local.get(['screenshots'], result => {
        const screenshots = result.screenshots || [];
        screenshots.forEach(screenshot => {
            addScreenshotToDOM(screenshot.title, screenshot.thumbnailUrl, screenshot.dataUrl);
        });
    });

    // Add snippet button click handler
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

    // Screenshot capture functionality
    captureButton.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 100 }, async (dataUrl) => {
                if (chrome.runtime.lastError) {
                    console.error('Screenshot failed:', chrome.runtime.lastError);
                    showAlert('Failed to capture screenshot.');
                    return;
                }

                // Create a temporary image to get dimensions
                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => img.onload = resolve);

                // Create a canvas for resizing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate thumbnail dimensions (maintaining aspect ratio)
                const aspectRatio = img.width / img.height;
                const thumbWidth = 300;
                const thumbHeight = thumbWidth / aspectRatio;
                
                canvas.width = thumbWidth;
                canvas.height = thumbHeight;
                
                // Draw and resize the image
                ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
                
                // Convert to compressed thumbnail
                const thumbnailDataUrl = canvas.toDataURL('image/png', 0.8);
                
                // Generate title with timestamp
                const title = `Screenshot ${new Date().toLocaleString()}`;
                
                // Save both original and thumbnail
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

    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const snippets = document.querySelectorAll('#snippet-list li');
        snippets.forEach(snippet => {
            const title = snippet.querySelector('h3').textContent.toLowerCase();
            snippet.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

    // Snippet functions
    function addSnippetToDOM(title, text) {
        const li = document.createElement('li');
        const headerContainer = document.createElement('div');
        headerContainer.className = 'header-container';
        
        const h3 = document.createElement('h3');
        h3.textContent = title;
        headerContainer.appendChild(h3);

        const micButton = document.createElement('button');
        micButton.className = 'microphone-button';
        micButton.innerHTML = '<i class="fas fa-volume-high"></i>';
        micButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const snippetText = pre.textContent.trim();
            readSnippetAloud(snippetText);
            showReadingPopup(this);
        });
        headerContainer.appendChild(micButton);

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', function(e) {
            e.stopPropagation();
            copyToClipboard(text);
            showCopyPopup(this);
        });
        headerContainer.appendChild(copyButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation();
            snippetList.removeChild(li);
            deleteSnippet(title, text);
        });
        headerContainer.appendChild(deleteButton);

        li.appendChild(headerContainer);

        const snippetContent = document.createElement('div');
        snippetContent.className = 'snippet-content';
        const pre = document.createElement('pre');
        pre.textContent = text;
        snippetContent.appendChild(pre);

        const editTextarea = document.createElement('textarea');
        editTextarea.className = 'snippet-edit';
        editTextarea.value = text;
        snippetContent.appendChild(editTextarea);

        li.appendChild(snippetContent);
        snippetList.appendChild(li);

        h3.addEventListener('click', function() {
            li.classList.toggle('expanded');
        });

        editTextarea.addEventListener('blur', function() {
            const updatedText = editTextarea.value.trim();
            pre.textContent = updatedText;
            updateSnippet(title, updatedText);
        });
    }

    // Screenshot functions
    function saveScreenshot(title, { original, thumbnail }) {
        chrome.storage.local.get(['screenshots'], result => {
            const screenshots = result.screenshots || [];
            screenshots.push({ 
                title, 
                dataUrl: original,
                thumbnailUrl: thumbnail,
                timestamp: Date.now() 
            });
            chrome.storage.local.set({ screenshots }, () => {
                addScreenshotToDOM(title, thumbnail, original);
            });
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
        
        screenshotList.appendChild(li);
    }

    async function copyImageToClipboard(dataUrl) {
        try {
            // Convert data URL to Blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // Create a new ClipboardItem
            const clipboardItem = new ClipboardItem({
                'image/png': blob
            });

            // Write to clipboard
            await navigator.clipboard.write([clipboardItem]);
            console.log('Image copied successfully');
        } catch (err) {
            console.error('Failed to copy image:', err);
            
            // Fallback method for copying image
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
        chrome.storage.local.get(['screenshots'], result => {
            const screenshots = result.screenshots || [];
            const index = screenshots.findIndex(s => s.title === title && s.dataUrl === dataUrl);
            if (index > -1) {
                screenshots.splice(index, 1);
                chrome.storage.local.set({ screenshots });
            }
        });
    }

    // Utility functions
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Text copied successfully');
        }, function(err) {
            console.error('Could not copy text:', err);
            showAlert('Failed to copy text to clipboard.');
        });
    }

    function showCopyPopup(button) {
        const popup = document.createElement('div');
        popup.className = 'copy-popup';
        popup.textContent = 'Copied!';
        button.style.position = 'relative';
        button.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 400);
    }

    function showReadingPopup(button) {
        const popup = document.createElement('div');
        popup.className = 'reading-popup';
        popup.textContent = 'Reading content...';
        button.style.position = 'relative';
        button.appendChild(popup);
        setTimeout(() => {
            popup.remove();
        }, 700);
    }

    function saveSnippet(title, text) {
        chrome.storage.local.get(['snippets'], function(result) {
            const snippets = result.snippets || [];
            snippets.push({ title, text });
            chrome.storage.local.set({ snippets: snippets });
        });
    }

    function deleteSnippet(title, text) {
        chrome.storage.local.get(['snippets'], function(result) {
            const snippets = result.snippets || [];
            const index = snippets.findIndex(snippet => snippet.title === title && snippet.text === text);
            if (index > -1) {
                snippets.splice(index, 1);
                chrome.storage.local.set({ snippets: snippets });
            }
        });
    }

    function updateSnippet(title, newText) {
        chrome.storage.local.get(['snippets'], function(result) {
            const snippets = result.snippets || [];
            const index = snippets.findIndex(snippet => snippet.title === title);
            if (index > -1) {
                snippets[index].text = newText;
                chrome.storage.local.set({ snippets: snippets });
            }
        });
    }

    function checkForDuplicateTitle(title, callback) {
        chrome.storage.local.get(['snippets'], function(result) {
            const snippets = result.snippets || [];
            const isDuplicate = snippets.some(snippet => snippet.title === title);
            callback(isDuplicate);
        });
    }

    function showAlert(message) {
        let alert = document.querySelector('.alert');
        if (alert) {
            alert.textContent = message;
        } else {
            alert = document.createElement('div');
            alert.className = 'alert';
            alert.textContent = message;
            snippetList.parentNode.insertBefore(alert, snippetList);
        }
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    function readSnippetAloud(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

    // Tab handling
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = snippetInput.selectionStart;
            const end = snippetInput.selectionEnd;
            const tab = '   ';
            snippetInput.value = snippetInput.value.substring(0, start) + tab + snippetInput.value.substring(end);
            snippetInput.selectionStart = snippetInput.selectionEnd = start + tab.length;
        }
    });
});