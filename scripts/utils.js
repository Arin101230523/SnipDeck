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

function showAlert(message) {
    let alert = document.querySelector('.alert');
    if (alert) {
        alert.textContent = message;
    } else {
        alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = message;
        document.querySelector('#snippet-list').parentNode.insertBefore(alert, document.querySelector('#snippet-list'));
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