import { AuthService } from "../../services/authService";

export const DashboardView = {
  template: `
    <div class="container" style="margin-top: 50px;">
      <h1>Admin Dashboard</h1>
      <p>Welcome back, <span id="userEmail" style="font-weight: bold;"></span></p>
      
      <div style="margin-top: 20px;">
        <button id="logoutBtn" style="padding: 0.5rem 1rem; background-color: var(--danger-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
          Logout
        </button>
      </div>
    </div>
  `,

  init(user) {
    // Show user email
    document.getElementById('userEmail').textContent = user.email;

    // Handle Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await AuthService.logout();
      // Again, main.js will handle the redirect
    });
  }
};