import '../../assets/css/global.css';
import { HomeView } from './homeView';
import { ShopDetailView } from './shopDetailView';

export const UserLayout = {
  template: `
    <div class="user-wrapper">
      <header style="background: white; padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100;">
        <h2 style="color: var(--primary-color); font-weight: bold;">Mercatora Mall</h2>
        <nav>
            <button id="publicLoginBtn" style="background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); padding: 5px 15px; border-radius: 4px; cursor: pointer;">
                Admin Login
            </button>
        </nav>
      </header>

      <main id="publicContent" class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
        </main>
    </div>
  `,

  init(onLoginRequest) {
    const content = document.getElementById('publicContent');
    const loginBtn = document.getElementById('publicLoginBtn');

    // Navigation Helper
    const loadHome = () => {
        content.innerHTML = HomeView.template;
        HomeView.init({
            onNavigateToShop: (shopData) => loadShopDetail(shopData)
        });
        window.scrollTo(0,0);
    };

    const loadShopDetail = (shopData) => {
        content.innerHTML = ShopDetailView.template;
        ShopDetailView.init({
            shop: shopData,
            onBack: () => loadHome()
        });
        window.scrollTo(0,0);
    };

    // Initial Load
    loadHome();

    // Login Handler
    loginBtn.addEventListener('click', onLoginRequest);
  }
};