export function saveHref() {
    localStorage.setItem("href", window.location.href);
}

export function getHref() {
    return localStorage.getItem("href") ?? "/";
}

export function restoreHref() {
    const href = localStorage.getItem("href");
    if (href) {
        localStorage.removeItem("href");
        window.location.href = href;
    } else {
        window.location.href = "/";
    }
    // window.location.reload();
}