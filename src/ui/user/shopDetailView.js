import { ProductService } from "../../services/productService";
import { CartService } from "../../services/cartService";
import { Toast } from "../common/toast";
import { ProductModal } from "./productModal";

export const ShopDetailView = {
    template: `
        <div class="container" style="padding-top: 2rem;">
            <div style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.9rem;">
                <span id="crumbHome" style="cursor: pointer; text-decoration: underline;">Home</span> > 
                <span id="crumbShop" style="font-weight: bold;">Loading...</span>
            </div>

            <div class="glass-card" style="padding: 2rem; margin-bottom: 2rem; border-left: 5px solid var(--primary-color);">
                <h1 id="shopTitle" style="margin-bottom: 0.5rem;">Shop Name</h1>
                <p id="shopMeta" style="color: var(--text-muted);">Details...</p>
            </div>

            <h2 style="margin-bottom: 1.5rem;">Products</h2>
            <div id="shopProductList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                <p>Loading products...</p>
            </div>
        </div>
    `,

    async init(params) {
        const { shop, onBack } = params;

        // Setup Breadcrumbs
        document.getElementById('crumbHome').addEventListener('click', onBack);
        document.getElementById('crumbShop').textContent = shop.name;

        // Header Info
        document.getElementById('shopTitle').textContent = shop.name;
        document.getElementById('shopMeta').textContent = `${shop.category} | ${shop.floor} Floor`;
        container.innerHTML = products.map(p => `
    <div class="glass-card product-card" data-id="${p.id}" style="padding: 1rem; cursor: pointer;">
        </div>
`).join('');

        // Fetch Products
        const container = document.getElementById('shopProductList');
        try {
            const products = await ProductService.getProductsByShop(shop.id);

            if (products.length === 0) {
                container.innerHTML = '<p>No products available.</p>';
                return;
            }

            container.innerHTML = products.map(p => `
                <div class="glass-card" style="padding: 1rem;">
                    <div style="height: 150px; background: #f1f5f9; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #cbd5e1;">📷</div>
                    <h4 style="margin-bottom: 0.5rem;">${p.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <span style="font-weight: bold; color: var(--primary-color);">₹${p.price}</span>
                        <button class="add-cart-btn" data-id="${p.id}" style="background: var(--primary-color); color: white; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer;">
                            + Add
                        </button>
                    </div>
                </div>
            `).join('');

            // Attach Cart Listeners
            container.querySelectorAll('.add-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const product = products.find(p => p.id === e.target.dataset.id);
                    CartService.addToCart(product);
                    Toast.show(`Added ${product.name} to cart`, "success");
                });
                container.querySelectorAll('.product-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        // Prevent modal if clicking the "Add" button directly
                        if (e.target.classList.contains('add-cart-btn')) return;

                        const product = products.find(p => p.id === card.dataset.id);
                        ProductModal.open(product);
                    });
                });
            });

        } catch (error) {
            container.innerHTML = '<p>Error loading products.</p>';
        }
    }
};