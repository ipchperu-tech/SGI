import { getFirestore, collection, onSnapshot, query, where, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase-config.js';

let currentUserEmail = null;
let currentUserRole = null;
let currentUserName = null; 
let currentPageId = 'dashboard';
let presenceInterval = null; // Variable para el intervalo de presencia

let modulosCargados = {
    dashboard: false,
    asistencia: false,
    verregistros: false,
    registrardata: false,
    modificardata: false,
    gestiones: false,
    cobranzas: false,
    controlpagos: false,
    seguimientos: false,
    calculadora: false,
    estadisticas: false,
    restaurar: false,
    admin: false
};

const permissions = {
    'Director Marketing': ['dashboard', 'ver-registros', 'registrar-data', 'modificar-data', 'gestiones', 'cobranzas', 'control-pagos', 'seguimientos', 'calculadora', 'estadisticas', 'restaurar', 'admin'],
    'Soporte Académico': ['dashboard', 'ver-registros', 'registrar-data', 'modificar-data', 'gestiones', 'seguimientos', 'cobranzas', 'calculadora'],
    'Cobranzas': ['dashboard', 'ver-registros', 'cobranzas', 'gestiones', 'control-pagos', 'seguimientos', 'registrar-data'],
    'Atención Estudiantil': ['dashboard', 'ver-registros', 'calculadora'],
    'Administración y Presidencia': ['dashboard', 'ver-registros', 'estadisticas', 'control-pagos'],
    'Coordinación Académica': ['dashboard', 'ver-registros', 'estadisticas'],
    'Dirección Académica': ['dashboard', 'ver-registros', 'estadisticas'],
    'Diseño': ['dashboard', 'ver-registros'],
    'Recursos Humanos': ['dashboard', 'ver-registros', 'estadisticas'],
    'Calidad': ['dashboard', 'ver-registros', 'estadisticas', 'calculadora'],
    'Inscripciones': ['dashboard', 'ver-registros', 'cobranzas', 'gestiones', 'control-pagos', 'seguimientos', 'registrar-data']
};

export function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.addEventListener('transitionend', () => preloader.remove());
    }
}

function setMaintenanceBanner(isActive) {
    const banner = document.getElementById('maintenance-banner');
    if (!banner) return;
    banner.classList.toggle('hidden', !isActive);
}

export function showNotification(message, type = 'success', duration = 5000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notif = document.createElement('div');
    const colors = {
        success: 'bg-green-100 border-green-500 text-green-700',
        error: 'bg-red-100 border-red-500 text-red-700',
        info: 'bg-blue-100 border-blue-500 text-blue-700'
    };
    const icon = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-times-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    notif.className = `p-4 rounded-lg shadow-lg flex items-center gap-3 border-l-4 transform translate-x-full opacity-0 transition-all duration-500 ease-in-out cursor-pointer`;
    notif.classList.add(...colors[type].split(' '));
    notif.innerHTML = `<span>${icon[type]}</span><span>${message}</span>`;
    container.appendChild(notif);
    setTimeout(() => notif.classList.remove('translate-x-full', 'opacity-0'), 10);
    const timeoutId = setTimeout(() => {
        notif.style.opacity = '0';
        notif.addEventListener('transitionend', () => notif.remove());
    }, duration);
    notif.addEventListener('click', () => {
        clearTimeout(timeoutId);
        notif.style.opacity = '0';
        notif.addEventListener('transitionend', () => notif.remove());
    });
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) { resolve(window.confirm(message)); return; }
        const textEl = modal.querySelector('#confirm-modal-text');
        const okBtn = modal.querySelector('#confirm-modal-ok');
        const cancelBtn = modal.querySelector('#confirm-modal-cancel');
        
        textEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const close = (result) => {
            modal.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(result);
        };

        okBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
    });
}


export function showPage(pageId, params = {}) {
    currentPageId = pageId;
    localStorage.setItem('lastVisitedPage', pageId);

    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const pageToShow = document.getElementById(`page-${pageId}`);
    const iframe = document.getElementById(`iframe-${pageId}`);
    
    let fileName = pageId.replace(/-/g, '_') + '.html';
    if (pageId === 'ver-registros') fileName = 'ver_registros.html';
    if (pageId === 'registrar-data') fileName = 'registrar_data.html';
    if (pageId === 'modificar-data') fileName = 'modificaciones.html';
    if (pageId === 'control-pagos') fileName = 'control_pagos.html';

    let url = `${fileName}?user=${encodeURIComponent(currentUserEmail)}&role=${encodeURIComponent(currentUserRole)}&userName=${encodeURIComponent(currentUserName)}`;
    
    for (const key in params) {
        if (params[key]) { 
            url += `&${key}=${encodeURIComponent(params[key])}`;
        }
    }

    const moduleKey = pageId.replace(/-/g, '');
    if (!modulosCargados[moduleKey] || Object.keys(params).length > 0) {
        iframe.src = url;
        modulosCargados[moduleKey] = true;
    }
    
    if (pageToShow) pageToShow.classList.remove('hidden');

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && !sidebar.classList.contains('md:translate-x-0')) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }

    document.querySelectorAll('#main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) link.classList.add('active');
    });
}

function updateNotificationsBadge() {
    const badge = document.getElementById('notifications-badge');
    const q = query(collection(db, "seguimientos"), where("estado", "==", "Pendiente"));
    onSnapshot(q, (snapshot) => {
        const count = snapshot.size;
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}

// --- NUEVA LÓGICA DE PRESENCIA ---
async function updateUserPresence(status) {
    if (!currentUserEmail) return;
    try {
        const presenceRef = doc(db, 'user_presence', currentUserEmail);
        await setDoc(presenceRef, {
            status: status,
            last_seen: serverTimestamp(),
            userName: currentUserName,
            userRole: currentUserRole
        });
    } catch (error) {
        console.error("Error updating presence:", error);
    }
}

function startPresenceSystem() {
    updateUserPresence('online');
    if (presenceInterval) clearInterval(presenceInterval);
    presenceInterval = setInterval(() => {
        updateUserPresence('online');
    }, 60 * 1000); // Cada 60 segundos
}

function stopPresenceSystem() {
    if (presenceInterval) clearInterval(presenceInterval);
    presenceInterval = null;
    updateUserPresence('offline');
}
// --- FIN DE LÓGICA DE PRESENCIA ---


export function handleUserLoggedIn(userName, userEmail, userRole, isMaintenanceAdmin = false) {
    if (!userRole) {
        showNotification("Acceso denegado. Su usuario no tiene un rol asignado.", "error");
        handleUserLoggedOut();
        return;
    }
    currentUserEmail = userEmail;
    currentUserRole = userRole; 
    currentUserName = userName;
    
    const userInfoDiv = document.getElementById('userInfo');
    const mobileUserInfoDiv = document.getElementById('mobile-user-info');
    
    const userHtml = `<p class="text-sm font-semibold text-gray-700">${userName}</p><p class="text-xs text-gray-500 break-words">${userEmail} (${userRole})</p>`;
    userInfoDiv.innerHTML = userHtml;
    mobileUserInfoDiv.innerHTML = `<p class="text-sm font-semibold text-gray-700">${userName}</p>`;
    
    const allowedModules = permissions[userRole] || [];
    document.querySelectorAll('#main-nav a.nav-link').forEach(link => {
        link.style.display = allowedModules.includes(link.dataset.page) ? 'flex' : 'none';
    });
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('refresh-btn').classList.remove('hidden');
    
    const lastPage = localStorage.getItem('lastVisitedPage');
    const defaultPage = allowedModules[0] || 'dashboard';
    let pageToShow = defaultPage;

    if (lastPage && allowedModules.includes(lastPage)) {
        pageToShow = lastPage;
    }
    
    let params = {};
    if (pageToShow === 'dashboard') {
        params.allowed = allowedModules.join(',');
    }
    showPage(pageToShow, params);
    
    updateNotificationsBadge();
    startPresenceSystem(); // Iniciar sistema de presencia

    if (isMaintenanceAdmin) {
        setTimeout(() => {
            showNotification("El Modo Mantenimiento está ACTIVO. Solo tú tienes acceso.", "info", 10000);
        }, 500); 
    }
}

export function handleUserLoggedOut(isMaintenanceActive = false) {
    stopPresenceSystem(); // Detener sistema de presencia
    currentUserEmail = null;
    currentUserRole = null;
    currentUserName = null;
    localStorage.removeItem('lastVisitedPage');
    document.getElementById('userInfo').innerHTML = '';
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('refresh-btn').classList.add('hidden');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-form').reset();
    setMaintenanceBanner(isMaintenanceActive);

    for (const key in modulosCargados) {
        modulosCargados[key] = false;
    }
}

export function setupEventListeners(loginHandler, logoutHandler) {
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        document.getElementById('loginError').textContent = '';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Ingresando...';
        loginHandler(email, password).catch((error) => {
            if (error.message === 'maintenance') {
                document.getElementById('loginError').textContent = 'El sistema está en mantenimiento. Acceso denegado.';
            } else {
                document.getElementById('loginError').textContent = 'Correo o contraseña incorrectos.';
            }
        }).finally(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesión';
        });
    });

    document.getElementById('logout-btn').addEventListener('click', logoutHandler);

    document.getElementById('main-nav').addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('a');
        if (link && link.dataset.page) {
            let params = {};
            if (link.dataset.page === 'dashboard') {
                const allowedModules = permissions[currentUserRole] || [];
                params.allowed = allowedModules.join(',');
            }
            showPage(link.dataset.page, params);
        }
    });

    document.getElementById('refresh-btn').addEventListener('click', () => {
        const iframe = document.getElementById(`iframe-${currentPageId}`);
        if (iframe) {
            let url = iframe.src.split('?')[0] + `?user=${encodeURIComponent(currentUserEmail)}&role=${encodeURIComponent(currentUserRole)}&userName=${encodeURIComponent(currentUserName)}&t=${new Date().getTime()}`;
            if (currentPageId === 'dashboard') {
                const allowedModules = permissions[currentUserRole] || [];
                url += `&allowed=${allowedModules.join(',')}`;
            }
            iframe.src = url;
            showNotification(`Módulo '${currentPageId}' actualizado.`, 'info', 2000);
        }
    });
    
    window.addEventListener('message', (event) => {
        const { data } = event;
        if (!data || !data.type) return;
        if (data.type === 'show-notification') {
            showNotification(data.message, data.messageType, data.duration);
        } else if (data.type === 'show-confirm') {
            showConfirm(data.message).then(result => {
                event.source.postMessage({ type: 'confirm-result', result: result, confirmId: data.confirmId }, event.origin);
            });
        } else if (data.type === 'navigate') {
            showPage(data.page);
        } else if (data.type === 'navigateWithFilter') {
            const params = {
                filter: data.filter,
                value: data.value,
                tab: data.tab,
                curso: data.curso
            };
            showPage(data.page, params);
        }
    });
}