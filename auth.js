import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { app } from './firebase-config.js';
import { handleUserLoggedIn, handleUserLoggedOut, hidePreloader, showNotification } from './ui.js';

const auth = getAuth(app);
const db = getFirestore(app);

// Variable para almacenar la función que detiene el listener y evitar duplicados
let unsubscribeMaintenanceListener = null;

export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        // Detener cualquier listener anterior para evitar fugas de memoria al cambiar de usuario
        if (unsubscribeMaintenanceListener) {
            unsubscribeMaintenanceListener();
            unsubscribeMaintenanceListener = null;
        }

        try {
            if (user) {
                const userDocRef = doc(db, "usuarios", user.email);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    handleUserLoggedIn(userData.nombreCompleto, user.email, userData.rol);

                    // Iniciar el listener de mantenimiento EN TIEMPO REAL
                    const systemStatusRef = doc(db, "systemInfo", "status");
                    unsubscribeMaintenanceListener = onSnapshot(systemStatusRef, (statusSnap) => {
                        const statusData = statusSnap.exists() ? statusSnap.data() : { maintenanceMode: false };
                        if (statusData.maintenanceMode === true && auth.currentUser && auth.currentUser.email !== statusData.allowedUser) {
                            console.log("Modo mantenimiento activado. Forzando cierre de sesión.");
                            showNotification("El sistema ha entrado en mantenimiento. Se cerrará tu sesión.", "info", 8000);
                            // Se espera un momento para que el usuario vea la notificación antes de ser deslogueado
                            setTimeout(() => {
                                signOut(auth);
                            }, 3000);
                        }
                    });

                } else {
                    await signOut(auth); // El usuario existe en Auth pero no en la BD de usuarios
                }
            } else {
                const systemStatusRef = doc(db, "systemInfo", "status");
                const systemStatusSnap = await getDoc(systemStatusRef);
                const systemStatus = systemStatusSnap.exists() ? systemStatusSnap.data() : { maintenanceMode: false };
                handleUserLoggedOut(systemStatus.maintenanceMode);
            }
        } catch (error) {
            console.error("Error en initAuth:", error);
            handleUserLoggedOut(false); 
        } finally {
            hidePreloader();
        }
    });
}

export async function login(email, password) {
    const systemStatusRef = doc(db, "systemInfo", "status");
    const systemStatusSnap = await getDoc(systemStatusRef);
    const systemStatus = systemStatusSnap.exists() ? systemStatusSnap.data() : { maintenanceMode: false };

    if (systemStatus.maintenanceMode === true && email !== systemStatus.allowedUser) {
        throw new Error("maintenance"); // Lanza un error específico para ser manejado en la UI
    }

    return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
    return signOut(auth);
}

