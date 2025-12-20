import '../../assets/css/admin.css';
import { AuthService } from "../../services/authService";
import { ShopView } from "./shops/shopView";
import { ProductView } from "./products/productView";
import { LogView } from "./audit/auditView";
import { DashboardView } from "./dashboard/dashboardView"; // <--- IMPORT

export const AdminLayout = {
  template: `
    <div class="admin-wrapper">
      <nav class="admin-sidebar">
        <h2>Mercatora Admin</h2>
        <a class="nav-link active" data-target="dashboard">📊 Dashboard</a>
        <a class="nav-link" data-target="shops">🏪 Shops</a>
        <a class="nav-link" data-target="products">📦 Products</a>
        <a class="nav-link" data-target="logs">🛡️ Logs</a> 
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </nav>

      <main class="admin-content" id="mainContent">
        </main>
    </div>
  `,

  init(user) {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await AuthService.logout();
    });

    const links = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('mainContent');

    const loadTab = (target) => {
      links.forEach(l => l.classList.remove('active'));
      const activeLink = document.querySelector(`[data-target="${target}"]`);
      if(activeLink) activeLink.classList.add('active');

      // Router Switch
      if (target === 'dashboard') {
        contentArea.innerHTML = DashboardView.template;
        DashboardView.init();
      } else if (target === 'shops') {
        contentArea.innerHTML = ShopView.template;
        ShopView.init();
      } else if (target === 'products') {
        contentArea.innerHTML = ProductView.template;
        ProductView.init();
      } else if (target === 'logs') {
        contentArea.innerHTML = LogView.template;
        LogView.init();
      }
    };

    // Navigation Listeners
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        loadTab(e.target.dataset.target);
      });
    });

    // Default to Dashboard
    loadTab('dashboard');
  }
};