import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC--X4Z95kEd7nd5X4P6B5yW6HPTiRxpQ",
  authDomain: "bdv3-ipch.firebaseapp.com",
  projectId: "bdv3-ipch",
  storageBucket: "bdv3-ipch.firebasestorage.app",
  messagingSenderId: "993842726107",
  appId: "1:993842726107:web:5e9d2b56f29238f2dc38fe"
};

// Inicializa la app de Firebase
const app = initializeApp(firebaseConfig);

// --- CORRECCIÓN: Se inicializan los servicios UNA SOLA VEZ y se exportan ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app }; // Se exporta 'app' por si se necesita en otro lugar
