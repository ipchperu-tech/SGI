import { db } from "./firebase-config.js";
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Obtiene parámetros de la URL actual.
 */
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Convierte timestamps de Firestore a Date.
 */
export function safeToDate(firestoreTimestamp) {
    if (!firestoreTimestamp) return null;
    if (typeof firestoreTimestamp.toDate === 'function') return firestoreTimestamp.toDate();
    if (typeof firestoreTimestamp === 'string') {
        const date = new Date(firestoreTimestamp);
        if (!isNaN(date)) return date;
    }
    if (typeof firestoreTimestamp.seconds === 'number') return new Date(firestoreTimestamp.seconds * 1000);
    return null;
}

/**
 * Muestra notificación Toast comunicándose con el padre.
 */
export function showNotification(message, type = 'success', duration = 5000) {
    if (window.self !== window.top) {
        window.parent.postMessage({ type: 'show-notification', message, messageType: type, duration }, '*');
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Muestra modal de confirmación.
 */
export function customConfirm(message) {
    return new Promise((resolve) => {
        if (window.self !== window.top) {
            const confirmId = Math.random().toString(36).substring(2, 15);
            const listener = (event) => {
                if (event.data.type === 'confirm-result' && event.data.confirmId === confirmId) {
                    window.removeEventListener('message', listener);
                    resolve(event.data.result);
                }
            };
            window.addEventListener('message', listener);
            window.parent.postMessage({ type: 'show-confirm', message, confirmId }, '*');
        } else {
            resolve(window.confirm(message));
        }
    });
}

/**
 * Registra acciones en el historial de cambios global.
 * Detecta automáticamente el usuario actual desde la URL del iframe.
 */
export async function logAction(action, description) {
    const currentUserEmail = getQueryParam('user') || 'sistema@sgi.com';
    try {
        await addDoc(collection(db, 'historialCambios'), {
            fecha: Timestamp.now(),
            usuario: currentUserEmail,
            accion: action,
            descripcion: description
        });
    } catch (error) {
        console.error("Error logging action:", error);
    }
}