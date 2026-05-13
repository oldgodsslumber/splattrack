// Firebase Realtime Database relay for SplatTrack.
// API keys are project identifiers, not secrets — safe to commit publicly.
// Security is enforced by the database rules in the Firebase console.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, ref, onValue, set, remove, onDisconnect, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsK2EWJ1L3eokE1nkRwFe8pcmHLmbcyZQ",
  authDomain: "splattrack-fa638.firebaseapp.com",
  databaseURL: "https://splattrack-fa638-default-rtdb.firebaseio.com",
  projectId: "splattrack-fa638",
  storageBucket: "splattrack-fa638.firebasestorage.app",
  messagingSenderId: "123552315819",
  appId: "1:123552315819:web:d24f8ff7289973de177aee",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.splattrackFirebase = { db, ref, onValue, set, remove, onDisconnect, serverTimestamp };
window.dispatchEvent(new Event('splattrack-firebase-ready'));
