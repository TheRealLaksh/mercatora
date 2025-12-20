import { ShopService } from "../../services/shopService";
import { Toast } from "../common/toast"; // Ensure you created this in the previous step

export const HomeView = {
    template: `
        <div class="hero" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1519567241046-7f570eee3c9f?auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; padding: 4rem 2rem 5rem; border-radius: 0 0 30px 30px; color: white; text-align: center;">
            <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">Mercatora</h1>
            <p style="font-size: 1.2rem; opacity: 0.9;">Shop. Eat. Play. Repeat.</p>
        </div>

        <div class="search-container">
            <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search shops, categories, or floors...">
        </div>

        <div class="container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem;">
            <button class="pill active" data-cat="all" style="padding: 8px 20px; border-radius: 20px; border: none; background: var(--primary-color); color: white; cursor: pointer;">All</button>
            <button class="pill" data-cat="Fashion" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Fashion</button>
            <button class="pill" data-cat="Electronics" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Electronics</button>
            <button class="pill" data-cat="Food" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Food</button>
        </div>

        <div class="container" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">Happening Now 🔥</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                <div style="background: linear-gradient(45deg, #ff9a9e, #fad0c4); padding: 1.5rem; border-radius: 12px; color: white;">
                    <h4>Black Friday Sale</h4>
                    <p>Up to 50% off on all Fashion stores!</p>
                </div>
                <div style="background: linear-gradient(45deg, #a18cd1, #fbc2eb); padding: 1.5rem; border-radius: 12px; color: white;">
                    <h4>Live Music @ Food Court</h4>
                    <p>Tonight at 7 PM. Don't miss out.</p>
                </div>
            </div>
        </div>

        <div class="container">
            <h2 style="margin-bottom: 1rem;">Directory</h2>
            <div id="publicShopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
                </div>
        </div>
    `,

    async init(params) {
        const { onNavigateToShop } = params; 
        const container = document.getElementById('publicShopList');
        const searchInput = document.getElementById('searchInput');
        
        // 1. Show Skeletons immediately
        container.innerHTML = this.getSkeletonTemplate().repeat(4);

        let allShops = [];
        try {
            // Simulate network delay to show off skeleton (optional, remove in prod)
            // await new Promise(r => setTimeout(r, 800)); 

            allShops = (await ShopService.getAllShops()).filter(s => s.status === 'active');
            this.renderShops(allShops, container, onNavigateToShop);
        } catch (error) {
            container.innerHTML = '<p>System currently unavailable.</p>';
        }

        // 2. Search Logic
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allShops.filter(shop => 
                shop.name.toLowerCase().includes(term) || 
                shop.category.toLowerCase().includes(term) ||
                shop.floor.toLowerCase().includes(term)
            );
            this.renderShops(filtered, container, onNavigateToShop);
        });

        // 3. Pill Navigation Logic
        document.querySelectorAll('.pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.pill').forEach(b => {
                    b.style.background = 'var(--card-bg)';
                    b.style.color = 'var(--text-color)';
                });
                e.target.style.background = 'var(--primary-color)';
                e.target.style.color = 'white';

                const cat = e.target.dataset.cat;
                const filtered = cat === 'all' ? allShops : allShops.filter(s => s.category.includes(cat));
                this.renderShops(filtered, container, onNavigateToShop);
            });
        });
    },

    // Helper: Skeleton HTML
    getSkeletonTemplate() {
        return `
            <div class="glass-card" style="height: 300px; display: flex; flex-direction: column;">
                <div class="skeleton" style="height: 120px; width: 100%;"></div>
                <div style="padding: 1.5rem; flex: 1;">
                    <div class="skeleton" style="height: 20px; width: 50%; margin-bottom: 10px;"></div>
                    <div class="skeleton" style="height: 30px; width: 80%; margin-bottom: 15px;"></div>
                    <div class="skeleton" style="height: 20px; width: 40%;"></div>
                </div>
            </div>
        `;
    },

    renderShops(shops, container, onNavigate) {
        if (shops.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <h3>🚫 No shops found</h3>
                    <p>Try searching for something else.</p>
                </div>
            `;
            return;
        }

        // Get Wishlist from LocalStorage
        const wishlist = JSON.parse(localStorage.getItem('mercatora_wishlist')) || [];

        container.innerHTML = shops.map(shop => {
            const isLiked = wishlist.includes(shop.id) ? 'active' : '';
            const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1); 

            return `
            <div class="glass-card">
                <div style="background: var(--primary-color); height: 100px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 2rem; position: relative;">
                    🏬
                    <button class="heart-btn ${isLiked}" data-id="${shop.id}" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 50%;">
                        ♥
                    </button>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary-color); font-weight: bold;">${shop.category}</span>
                        <span style="color: var(--accent-color);">⭐ ${rating}</span>
                    </div>
                    <h3 style="margin: 0.5rem 0; font-size: 1.25rem;">${shop.name}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">Floor: ${shop.floor}</p>
                    
                    <button class="view-shop-btn" data-id="${shop.id}" 
                        style="width: 100%; padding: 10px; background: var(--background-color); border: 1px solid var(--border-color); border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Visit Shop
                    </button>
                </div>
            </div>
        `}).join('');

        // Event: Navigate to Shop
        container.querySelectorAll('.view-shop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shop = shops.find(s => s.id === e.target.dataset.id);
                onNavigate(shop);
            });
        });

        // Event: Toggle Wishlist
        container.querySelectorAll('.heart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shopId = e.target.dataset.id;
                let currentWishlist = JSON.parse(localStorage.getItem('mercatora_wishlist')) || [];

                if (currentWishlist.includes(shopId)) {
                    currentWishlist = currentWishlist.filter(id => id !== shopId);
                    e.target.classList.remove('active');
                    if(Toast) Toast.show("Removed from favorites");
                } else {
                    currentWishlist.push(shopId);
                    e.target.classList.add('active');
                    if(Toast) Toast.show("Added to favorites!", "success");
                }

                localStorage.setItem('mercatora_wishlist', JSON.stringify(currentWishlist));
            });
        });
    }
};