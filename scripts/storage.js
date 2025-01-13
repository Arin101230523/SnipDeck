function saveToStorage(key, data) {
    chrome.storage.local.set({ [key]: data });
}

function getFromStorage(key, callback) {
    chrome.storage.local.get([key], result => callback(result[key]));
}