// main.js - Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initializeTabs();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load selected text if available
    getFromStorage('selectedText', selectedText => {
        if (selectedText) {
            document.getElementById('snippet-input').value = selectedText;
            chrome.storage.local.remove('selectedText');
        }
    });
    
    // Load existing snippets
    getFromStorage('snippets', snippets => {
        snippets = snippets || [];
        snippets.forEach(snippet => addSnippetToDOM(snippet.title, snippet.text));
    });
    
    // Load existing screenshots
    getFromStorage('screenshots', screenshots => {
        screenshots = screenshots || [];
        screenshots.forEach(screenshot => {
            addScreenshotToDOM(screenshot.title, screenshot.thumbnailUrl, screenshot.dataUrl);
        });
    });
});