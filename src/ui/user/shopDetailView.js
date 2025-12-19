import { ProductService } from "../../services/productService";

export const ShopDetailView = {
    template: `
        <div style="margin-bottom: 20px;">
            <button id="backBtn" style="background: none; border: none; color: var(--primary-color); cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: bold;">
                ← Back to Directory
            </button>
        </div>

        <div style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h1 id="shopTitle" style="margin-bottom: 0.5rem;">Loading Shop...</h1>
            <p id="shopMeta" style="color: #64748b;">...</p>
        </div>

        <h2 style="margin-bottom: 1.5rem;">Products</h2>
        
        <div id="shopProductList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
            <p>Loading products...</p>
        </div>
    `,

    async init(params) {
        // params contains { shopId, shopName, shopFloor, etc }
        const { shop, onBack } = params;

        // 1. Setup Header
        document.getElementById('shopTitle').textContent = shop.name;
        document.getElementById('shopMeta').textContent = `${shop.category} | ${shop.floor} Floor`;

        // 2. Handle Back Button
        document.getElementById('backBtn').addEventListener('click', () => {
            onBack();
        });

        // 3. Fetch Products
        const container = document.getElementById('shopProductList');
        try {
            const products = await ProductService.getProductsByShop(shop.id);

            if (products.length === 0) {
                container.innerHTML = '<p>This shop has not listed any products yet.</p>';
                return;
            }

            container.innerHTML = products.map(p => `
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s;">
                    <div style="height: 150px; background: #f1f5f9; border-radius: 4px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #cbd5e1;">
                        📷 No Image
                    </div>
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${p.name}</h3>
                    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; height: 40px; overflow: hidden;">${p.description || ''}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 1.2rem; font-weight: bold; color: var(--text-color);">₹${p.price}</span>
                        <button style="background: var(--primary-color); color: white; border: none; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; cursor: pointer;">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            container.innerHTML = '<p>Error loading products.</p>';
        }
    }
};