import { ShopService } from "../../services/shopService";

export const HomeView = {
    // Template stays mostly the same...
    template: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 2.5rem; color: var(--secondary-color);">Explore Mercatora</h1>
            <p style="color: #64748b;">Discover the best shops and products in town.</p>
        </div>
        <div id="publicShopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
            <p>Loading Directory...</p>
        </div>
    `,

    async init(params) {
        // We receive a navigation callback
        const { onNavigateToShop } = params; 
        
        const container = document.getElementById('publicShopList');
        
        try {
            const shops = await ShopService.getAllShops();
            const activeShops = shops.filter(shop => shop.status === 'active');

            if (activeShops.length === 0) {
                container.innerHTML = '<p>No active shops found.</p>';
                return;
            }

            // Render List
            // Note: We add a class 'view-shop-btn' and data attributes to the button
            container.innerHTML = activeShops.map(shop => `
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background: var(--primary-color); height: 8px;"></div>
                    <div style="padding: 1.5rem;">
                        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">${shop.category}</span>
                        <h3 style="margin: 0.5rem 0; font-size: 1.25rem;">${shop.name}</h3>
                        <p style="color: #475569; margin-bottom: 1rem;">Floor: ${shop.floor}</p>
                        
                        <button 
                            class="view-shop-btn"
                            data-id="${shop.id}" 
                            data-name="${shop.name}"
                            data-floor="${shop.floor}"
                            data-category="${shop.category}"
                            style="width: 100%; padding: 8px; background: #f1f5f9; border: none; border-radius: 6px; color: var(--secondary-color); font-weight: 600; cursor: pointer;"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');

            // Attach Event Listeners to ALL buttons
            document.querySelectorAll('.view-shop-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Extract data from the button's dataset
                    const shopData = {
                        id: e.target.dataset.id,
                        name: e.target.dataset.name,
                        floor: e.target.dataset.floor,
                        category: e.target.dataset.category
                    };
                    // Trigger navigation
                    onNavigateToShop(shopData);
                });
            });

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p>System currently unavailable.</p>';
        }
    }
};