import '../../assets/css/admin.css'; // Import the specific CSS
import { AuthService } from "../../services/authService";
import { ShopView } from "./shops/shopView";
import { ProductView } from "./products/productView";

export const AdminLayout = {
  // The Skeleton
  template: `
    <div class="admin-wrapper">
      <nav class="admin-sidebar">
        <h2>Mercatora</h2>
        
        <a class="nav-link active" data-target="shops">🏪 Shops</a>
        <a class="nav-link" data-target="products">📦 Products</a>
        <a class="nav-link" data-target="offers">🏷️ Offers (Soon)</a>
        
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </nav>

      <main class="admin-content" id="mainContent">
        </main>
    </div>
  `,

  init(user) {
    // 1. Handle Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await AuthService.logout();
    });

    // 2. Handle Navigation
    const links = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('mainContent');

    // Function to switch tabs
    const loadTab = (target) => {
      // Update Active Class on Sidebar
      links.forEach(l => l.classList.remove('active'));
      const activeLink = document.querySelector(`[data-target="${target}"]`);
      if(activeLink) activeLink.classList.add('active');

      // Inject View
      if (target === 'shops') {
        contentArea.innerHTML = ShopView.template;
        ShopView.init();
      } else if (target === 'products') {
        contentArea.innerHTML = ProductView.template;
        ProductView.init();
      } else {
        contentArea.innerHTML = `<h1>Coming Soon</h1><p>Module: ${target}</p>`;
      }
    };

    // Attach Click Events
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        loadTab(target);
      });
    });

    // 3. Load Default Tab
    loadTab('shops');
  }
};