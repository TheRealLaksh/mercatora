import { ShopService } from "../../services/shopService";

export const HomeView = {
    template: `
        <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="font-size: 2.5rem; color: var(--secondary-color);">Explore Mercatora</h1>
            <p style="color: #64748b;">Discover the best shops and products in town.</p>
        </div>

        <div style="margin-bottom: 2rem; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
            
            <input type="text" id="searchInput" placeholder="Search shops by name or category..." 
                style="padding: 12px; width: 300px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            
            <select id="floorFilter" style="padding: 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: white;">
                <option value="all">All Floors</option>
                <option value="Ground">Ground Floor</option>
                <option value="1st">1st Floor</option>
                <option value="2nd">2nd Floor</option>
                <option value="3rd">3rd Floor</option>
            </select>

        </div>

        <div id="publicShopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
            <p>Loading Directory...</p>
        </div>
    `,

    async init(params) {
        const { onNavigateToShop } = params; 
        const container = document.getElementById('publicShopList');
        const searchInput = document.getElementById('searchInput');
        const floorFilter = document.getElementById('floorFilter');
        
        // State: Store all fetched shops here
        let allShops = [];

        // 1. Fetch Data
        try {
            const result = await ShopService.getAllShops();
            // Only keep active shops
            allShops = result.filter(shop => shop.status === 'active');
            
            // Initial Render
            this.renderShops(allShops, container, onNavigateToShop);

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p>System currently unavailable.</p>';
        }

        // 2. Filter Logic Function
        const applyFilters = () => {
            const query = searchInput.value.toLowerCase();
            const floor = floorFilter.value;

            const filtered = allShops.filter(shop => {
                // Check Name or Category matches search text
                const matchesSearch = shop.name.toLowerCase().includes(query) || 
                                      shop.category.toLowerCase().includes(query);
                
                // Check Floor matches (or if 'all' is selected)
                const matchesFloor = floor === 'all' || shop.floor === floor;

                return matchesSearch && matchesFloor;
            });

            this.renderShops(filtered, container, onNavigateToShop);
        };

        // 3. Attach Event Listeners
        searchInput.addEventListener('input', applyFilters);
        floorFilter.addEventListener('change', applyFilters);
    },

    // Helper: Render the Grid
    renderShops(shops, container, onNavigate) {
        if (shops.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 2rem;">
                    <h3>No shops found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = shops.map(shop => `
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

        // Re-attach listeners to the new buttons
        container.querySelectorAll('.view-shop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shopData = {
                    id: e.target.dataset.id,
                    name: e.target.dataset.name,
                    floor: e.target.dataset.floor,
                    category: e.target.dataset.category
                };
                onNavigate(shopData);
            });
        });
    }
};