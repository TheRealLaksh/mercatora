// Import Global Styles
import './assets/css/global.css';

// Initial App Logic
console.log('Mercatora System Initialized...');

// Render a placeholder to verify setup
const app = document.querySelector('#app');
app.innerHTML = `
  <div class="container" style="text-align: center; margin-top: 50px;">
    <h1>Welcome to Mercatora</h1>
    <p>System Status: <span style="color: var(--success-color); font-weight: bold;">ONLINE</span></p>
  </div>
`;