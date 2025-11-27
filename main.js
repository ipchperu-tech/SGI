import { initAuth, login, logout } from './auth.js';
import { setupEventListeners } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupEventListeners(login, logout);
});
