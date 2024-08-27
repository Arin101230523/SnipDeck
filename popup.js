document.addEventListener('DOMContentLoaded', function() {
    const addSnippetButton = document.getElementById('add-snippet');
    const titleInput = document.getElementById('title-input');
    const snippetInput = document.getElementById('snippet-input');
    const snippetList = document.getElementById('snippet-list');
    const searchInput = document.getElementById('search-input');

    // Load existing snippets
    chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        snippets.forEach(snippet => addSnippetToDOM(snippet.title, snippet.text));
    });

    // Add new snippet
    addSnippetButton.addEventListener('click', function() {
        const titleText = titleInput.value.trim();
        const snippetText = snippetInput.value.trim();
        if (titleText && snippetText) {
            addSnippetToDOM(titleText, snippetText);
            saveSnippet(titleText, snippetText);
            titleInput.value = '';
            snippetInput.value = '';
        }
    });

    // Search snippets
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

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', function(e) {
            e.stopPropagation();
            copyToClipboard(text);
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

        editTextarea.addEventListener('blur', function() {
            const updatedText = editTextarea.value.trim();
            pre.textContent = updatedText;
            updateSnippet(title, updatedText);
        });
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Snippet copied to clipboard!');
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
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
});