import '../css/loader.css';

export function createLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    return loader;
}

// Replaces the container's content with a spinner until you render real content into it.
export function showLoader(container) {
    container.innerHTML = '';
    container.appendChild(createLoader());
}

export function showPageLoader() {
    let overlay = document.getElementById('pageLoader');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pageLoader';
        overlay.className = 'loader-overlay';
        overlay.appendChild(createLoader());
        document.body.appendChild(overlay);
    }
}

export function hidePageLoader() {
    document.getElementById('pageLoader')?.remove();
}
