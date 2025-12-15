import './assets/css/global.css';
import { AuthService } from './services/authService';
import { LoginView } from './ui/auth/loginView';
import { DashboardView } from './ui/admin/dashboardView';

const app = document.querySelector('#app');

// Function to render a specific view
function renderView(view, data = null) {
  // 1. Inject HTML
  app.innerHTML = view.template;
  // 2. Attach Event Listeners
  view.init(data);
}

// Global Auth Listener (The "Traffic Cop")
AuthService.observeAuth((user) => {
  if (user) {
    // User IS logged in
    console.log("User detected:", user.email);
    renderView(DashboardView, user);
  } else {
    // User is NOT logged in
    console.log("No user. Showing Login.");
    renderView(LoginView);
  }
});