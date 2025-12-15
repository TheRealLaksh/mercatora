import { AuthService } from "../../services/authService";

export const LoginView = {
  // 1. Return the HTML for the login page
  template: `
    <div class="container" style="max-width: 400px; margin-top: 100px;">
      <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary-color);">Mercatora Login</h2>
        
        <form id="loginForm">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Email</label>
            <input type="email" id="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem;">Password</label>
            <input type="password" id="password" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          
          <button type="submit" style="width: 100%; padding: 0.75rem; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Login
          </button>
          
          <p id="errorMessage" style="color: var(--danger-color); margin-top: 1rem; text-align: center; display: none;"></p>
        </form>
      </div>
    </div>
  `,

  // 2. Attach Event Listeners (The Logic)
  init() {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Stop page reload
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = form.querySelector('button');

      // UI Feedback: Disable button
      btn.textContent = "Logging in...";
      btn.disabled = true;
      errorMsg.style.display = 'none';

      // Call the Service we created earlier
      const result = await AuthService.login(email, password);

      if (result.error) {
        // Show Error
        btn.textContent = "Login";
        btn.disabled = false;
        errorMsg.textContent = "Error: " + result.error;
        errorMsg.style.display = 'block';
      } else {
        console.log("Login Successful", result.user);
        // We don't need to redirect manually here.
        // main.js will detect the state change and redirect automatically.
      }
    });
  }
};