import './assets/css/global.css';
import { AuthService } from './services/authService';
import { LoginView } from './ui/auth/loginView';
import { AdminLayout } from './ui/admin/adminLayout';
import { UserLayout } from './ui/user/userLayout';

const app = document.querySelector('#app');

// Helper to render views
function render(view, data = null) {
  app.innerHTML = view.template;
  view.init(data);
}

// State Management
let currentUser = null;

// 1. Define the Routes
const Routes = {
  admin: () => render(AdminLayout, currentUser),
  public: () => render(UserLayout, () => Routes.login()), // Pass "Go To Login" function
  login: () => render(LoginView)
};

// 2. Observe Auth State
AuthService.observeAuth((user) => {
  currentUser = user;
  
  if (user) {
    // If logged in, go straight to Admin
    console.log("User detected. Loading Admin Dashboard.");
    Routes.admin();
  } else {
    // If NOT logged in, go to Public Mall
    console.log("Guest detected. Loading Public Mall.");
    Routes.public();
  }
});