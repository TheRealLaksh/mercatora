import './assets/css/global.css';
import { AuthService } from './services/authService';
import { LoginView } from './ui/auth/loginView';
import { AdminLayout } from './ui/admin/adminLayout'; // <--- CHANGED IMPORT

const app = document.querySelector('#app');

function renderView(view, data = null) {
  app.innerHTML = view.template;
  view.init(data);
}

AuthService.observeAuth((user) => {
  if (user) {
    console.log("User detected:", user.email);
    renderView(AdminLayout, user); // <--- CHANGED TO AdminLayout
  } else {
    console.log("No user. Showing Login.");
    renderView(LoginView);
  }
});