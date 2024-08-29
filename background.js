chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: '1',
        title: 'Upload Selected to SnipDeck',
        contexts: ['selection'],
    });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === '1' && info.selectionText) {
        chrome.storage.local.get(['selectedText'], (result) => {
            current = result.selectedText || '';
            current += info.selectionText + '\n';
            chrome.storage.local.set({ selectedText: current });
        });
    }
});


chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['selectedText'], (result) => {
        current = result.selectedText || '';
    });
});


chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['selectedText'], (result) => {
        current = result.selectedText || '';
    });
});