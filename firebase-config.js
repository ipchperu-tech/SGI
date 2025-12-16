import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC--X4Z95kEd7nd5X4P6B5yW6HPTiRxpQ",
  authDomain: "bdv3-ipch.firebaseapp.com",
  projectId: "bdv3-ipch",
  storageBucket: "bdv3-ipch.firebasestorage.app",
  messagingSenderId: "993842726107",
  appId: "1:993842726107:web:5e9d2b56f29238f2dc38fe"
};

// Inicializa la app principal
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Habilitar persistencia offline para optimización de lecturas
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistencia fallida: Múltiples pestañas abiertas.');
    } else if (err.code == 'unimplemented') {
        console.warn('El navegador no soporta persistencia.');
    }
});

// Exportamos todo lo necesario
export { app, auth, db, firebaseConfig };