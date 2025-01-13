function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contentSections = document.querySelectorAll('.content-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contentSections.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.content-section[data-tab="${tab.dataset.tab}"]`).classList.add('active');
        });
    });
}