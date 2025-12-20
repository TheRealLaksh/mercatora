import '../../assets/css/global.css';
import { HomeView } from './homeView';
import { ShopDetailView } from './shopDetailView';
import { CartDrawer } from './cartDrawer';

export const UserLayout = {
  template: `
    <div class="user-wrapper">
      <header style="background: var(--card-bg); padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100;">
        <div style="display: flex; align-items: center; gap: 20px;">
            <h2 style="color: var(--primary-color); font-weight: bold; cursor: pointer;" id="logoBtn">Mercatora</h2>
            <button id="themeToggle" style="background: none; border: 1px solid var(--border-color); padding: 5px 10px; border-radius: 20px; cursor: pointer;">🌙 Mode</button>
        </div>
        <nav style="display: flex; gap: 15px;">
            <button id="openCartBtn" style="background: var(--primary-color); color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer;">
                🛒 Cart
            </button>
            <button id="publicLoginBtn" style="background: transparent; color: var(--text-muted); border: none; cursor: pointer;">
                Admin Login
            </button>
        </nav>
      </header>

      <div id="cart-mount"></div>

      <main id="publicContent" style="min-height: 80vh;"></main>

      <footer style="background: var(--secondary-color); color: white; padding: 3rem 2rem; margin-top: 4rem;">
        <div class="container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
            <div>
                <h3>Mercatora</h3>
                <p style="opacity: 0.7; margin-top: 10px;">The best shopping experience in the city.</p>
            </div>
            <div>
                <h4>Links</h4>
                <p><a href="#" style="color: white; opacity: 0.7;">About Us</a></p>
                <p><a href="#" style="color: white; opacity: 0.7;">Contact</a></p>
            </div>
            <div>
                <h4>Hours</h4>
                <p style="opacity: 0.7;">Mon - Sun: 10 AM - 10 PM</p>
            </div>
        </div>
      </footer>
    </div>
  `,

  init(onLoginRequest) {
    const content = document.getElementById('publicContent');
    
    // 1. Initialize Cart
    document.getElementById('cart-mount').innerHTML = CartDrawer.template;
    CartDrawer.init();
    document.getElementById('openCartBtn').addEventListener('click', () => CartDrawer.open());

    // 2. Dark Mode Logic
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        themeToggle.textContent = isDark ? '☀️ Mode' : '🌙 Mode';
    });

    // 3. Navigation
    const loadHome = () => {
        content.innerHTML = HomeView.template;
        HomeView.init({ onNavigateToShop: loadShopDetail });
        window.scrollTo(0,0);
    };

    const loadShopDetail = (shopData) => {
        content.innerHTML = ShopDetailView.template;
        ShopDetailView.init({ shop: shopData, onBack: loadHome });
        window.scrollTo(0,0);
    };

    document.getElementById('logoBtn').addEventListener('click', loadHome);
    document.getElementById('publicLoginBtn').addEventListener('click', onLoginRequest);

    loadHome();
  }
};