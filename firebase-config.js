// Firebase Yapılandırması
// Ankara Çocuk projesinin Firebase bilgilerini buraya girin
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPbEuGqVofWdohAHJKqtmfEBN0Oc03Ya8",
  authDomain: "ankaracocukv3-b2182.firebaseapp.com",
  projectId: "ankaracocukv3-b2182",
  storageBucket: "ankaracocukv3-b2182.firebasestorage.app",
  messagingSenderId: "678969625372",
  appId: "1:678969625372:web:6e910af53e1218ab4488d9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
