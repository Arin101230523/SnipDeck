document.addEventListener('DOMContentLoaded', function() {
    const addSnippetButton = document.getElementById('add-snippet');
    const titleInput = document.getElementById('title-input');
    const snippetInput = document.getElementById('snippet-input');
    const snippetList = document.getElementById('snippet-list');
    const searchInput = document.getElementById('search-input');
    
    chrome.storage.local.get(['selectedText'], function(result) {
        if (result.selectedText) {
            snippetInput.value = result.selectedText;
            chrome.storage.local.remove('selectedText');
        }
    });
    
    chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        snippets.forEach(snippet => addSnippetToDOM(snippet.title, snippet.text));
    });

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

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const snippets = document.querySelectorAll('#snippet-list li');
        snippets.forEach(snippet => {
            const title = snippet.querySelector('h3').textContent.toLowerCase();
            snippet.style.display = title.includes(query) ? 'block' : 'none';
        });
    });

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
            li.classList.toggle('active');
        });

        // Update the snippet on blur (when editing is done)
        editTextarea.addEventListener('blur', function() {
            const updatedText = editTextarea.value.trim();
            pre.textContent = updatedText; // Update pre element with new text
            updateSnippet(title, updatedText);
        });
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Copied!');
        }, function(err) {
            console.error('Could not copy text:', err);
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
});

//Tab is changed to three spaces
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('snippet-input');
    editor.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            event.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const tab = '   ';
            editor.value = editor.value.substring(0, start) + tab + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + tab.length;
        }
    });
});