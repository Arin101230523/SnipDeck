document.addEventListener('DOMContentLoaded', function() {
    const addSnippetButton = document.getElementById('add-snippet');
    const titleInput = document.getElementById('title-input');
    const snippetInput = document.getElementById('snippet-input');
    const snippetList = document.getElementById('snippet-list');
    const searchInput = document.getElementById('search-input');

    chrome.storage.local.get(['snippets'], function(result) {
        const snippets = result.snippets || [];
        snippets.forEach(snippet => addSnippetToDOM(snippet.title, snippet.text));
    });

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

        const h3 = document.createElement('h3');
        h3.textContent = title;
        li.appendChild(h3);

        const snippetContent = document.createElement('div');
        snippetContent.className = 'snippet-content';
        const pre = document.createElement('pre');
        pre.textContent = text;
        snippetContent.appendChild(pre);

        const editTextarea = document.createElement('textarea');
        editTextarea.className = 'snippet-edit';
        editTextarea.value = text;
        snippetContent.appendChild(editTextarea);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation();
            snippetList.removeChild(li);
            deleteSnippet(title, text);
        });

        li.appendChild(deleteButton);
        li.appendChild(snippetContent);
        snippetList.appendChild(li);

        h3.addEventListener('click', function() {
            li.classList.toggle('active');
            if (li.classList.contains('active')) {
                editTextarea.value = pre.textContent;
                editTextarea.focus();
            }
        });

        editTextarea.addEventListener('blur', function() {
            const updatedText = editTextarea.value.trim();
            pre.textContent = updatedText;
            updateSnippet(title, updatedText);
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