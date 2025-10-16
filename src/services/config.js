export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://wsproject-5eb9.onrender.com/');

// Ensure base ends with exactly one '/'
const ensureTrailingSlash = (url) => (url.endsWith('/') ? url : url + '/');

export const WS_BASE_URL = ensureTrailingSlash(import.meta.env.VITE_WS_BASE_URL || API_BASE_URL);


