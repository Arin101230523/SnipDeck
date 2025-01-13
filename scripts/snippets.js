// snippets.js - Snippet-related functionality
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
        document.querySelector('#snippet-list').removeChild(li);
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
    document.querySelector('#snippet-list').appendChild(li);

    h3.addEventListener('click', function() {
        li.classList.toggle('expanded');
    });

    editTextarea.addEventListener('blur', function() {
        const updatedText = editTextarea.value.trim();
        pre.textContent = updatedText;
        updateSnippet(title, updatedText);
    });
}

function saveSnippet(title, text) {
    getFromStorage('snippets', snippets => {
        snippets = snippets || [];
        snippets.push({ title, text });
        saveToStorage('snippets', snippets);
    });
}

function deleteSnippet(title, text) {
    getFromStorage('snippets', snippets => {
        snippets = snippets || [];
        const index = snippets.findIndex(snippet => snippet.title === title && snippet.text === text);
        if (index > -1) {
            snippets.splice(index, 1);
            saveToStorage('snippets', snippets);
        }
    });
}

function updateSnippet(title, newText) {
    getFromStorage('snippets', snippets => {
        snippets = snippets || [];
        const index = snippets.findIndex(snippet => snippet.title === title);
        if (index > -1) {
            snippets[index].text = newText;
            saveToStorage('snippets', snippets);
        }
    });
}

function checkForDuplicateTitle(title, callback) {
    getFromStorage('snippets', snippets => {
        snippets = snippets || [];
        const isDuplicate = snippets.some(snippet => snippet.title === title);
        callback(isDuplicate);
    });
}