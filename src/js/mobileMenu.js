const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

function closeMenu() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
}

menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    overlay.classList.toggle('is-open');
});

overlay?.addEventListener('click', closeMenu);
