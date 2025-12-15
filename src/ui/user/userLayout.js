import '../../assets/css/global.css';
import { HomeView } from './homeView'; // We will create this next

export const UserLayout = {
  template: `
    <div class="user-wrapper">
      <header style="background: white; padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
        <h2 style="color: var(--primary-color); font-weight: bold;">Mercatora Mall</h2>
        <nav>
            <button id="publicLoginBtn" style="background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); padding: 5px 15px; border-radius: 4px; cursor: pointer;">
                Admin Login
            </button>
        </nav>
      </header>

      <main id="publicContent" class="container" style="padding-top: 2rem;">
        </main>
    </div>
  `,

  init(onLoginRequest) {
    // 1. Render Home View by default
    const content = document.getElementById('publicContent');
    content.innerHTML = HomeView.template;
    HomeView.init();

    // 2. Handle Login Button Click
    // We don't handle logic here; we tell main.js "User wants to login"
    document.getElementById('publicLoginBtn').addEventListener('click', () => {
        onLoginRequest();
    });
  }
};