import { ShopService } from "../../services/shopService";

export const HomeView = {
    template: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 2.5rem; color: var(--secondary-color);">Explore Mercatora</h1>
            <p style="color: #64748b;">Discover the best shops and products in town.</p>
        </div>

        <div style="margin-bottom: 2rem; display: flex; gap: 10px; justify-content: center;">
            <input type="text" placeholder="Search shops..." style="padding: 10px; width: 300px; border: 1px solid #ddd; border-radius: 4px;">
        </div>

        <div id="publicShopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
            <p>Loading Directory...</p>
        </div>
    `,

    async init() {
        const container = document.getElementById('publicShopList');
        
        try {
            // Reuse the Service we already built!
            const shops = await ShopService.getAllShops();
            
            // Filter only 'active' shops (Business Logic)
            const activeShops = shops.filter(shop => shop.status === 'active');

            if (activeShops.length === 0) {
                container.innerHTML = '<p>No active shops found.</p>';
                return;
            }

            container.innerHTML = activeShops.map(shop => `
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">
                    <div style="background: var(--primary-color); height: 8px;"></div>
                    <div style="padding: 1.5rem;">
                        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">${shop.category}</span>
                        <h3 style="margin: 0.5rem 0; font-size: 1.25rem;">${shop.name}</h3>
                        <p style="color: #475569; margin-bottom: 1rem;">Floor: ${shop.floor}</p>
                        <button style="width: 100%; padding: 8px; background: #f1f5f9; border: none; border-radius: 6px; color: var(--secondary-color); font-weight: 600; cursor: pointer;">
                            View Details
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            container.innerHTML = '<p>System currently unavailable.</p>';
        }
    }
};