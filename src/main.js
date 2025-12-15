import './assets/css/global.css';
import { auth, db } from './config/firebase.js'; // Import our new connection

console.log('Mercatora System Initialized...');

// Test Connection
console.log('Firebase Auth Service:', auth);
console.log('Firebase Database Service:', db);

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="container" style="text-align: center; margin-top: 50px;">
    <h1>Welcome to Mercatora</h1>
    <p>System Status: <span style="color: var(--success-color); font-weight: bold;">ONLINE</span></p>
    <p style="margin-top: 10px; color: var(--secondary-color);">
       Check the browser console (F12) to verify Firebase connection.
    </p>
  </div>
`;