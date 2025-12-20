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

        // 1. Setup Breadcrumbs & Header
        document.getElementById('crumbHome').addEventListener('click', onBack);
        document.getElementById('crumbShop').textContent = shop.name;
        document.getElementById('shopTitle').textContent = shop.name;
        document.getElementById('shopMeta').textContent = `${shop.category} | ${shop.floor} Floor`;

        // 2. Fetch Products
        const container = document.getElementById('shopProductList');
        
        try {
            const products = await ProductService.getProductsByShop(shop.id);

            if (products.length === 0) {
                container.innerHTML = '<p>No products available in this shop.</p>';
                return;
            }

            // 3. Render Products (Added 'product-card' class and 'data-id' for Modal)
            container.innerHTML = products.map(p => `
                <div class="glass-card product-card" data-id="${p.id}" style="padding: 1rem; cursor: pointer; transition: transform 0.2s;">
                    <div style="height: 150px; background: #f1f5f9; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 2rem;">
                        📷
                    </div>
                    <h4 style="margin-bottom: 0.5rem;">${p.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <span style="font-weight: bold; color: var(--primary-color);">₹${p.price}</span>
                        <button class="add-cart-btn" data-id="${p.id}" style="background: var(--primary-color); color: white; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer; z-index: 2; position: relative;">
                            + Add
                        </button>
                    </div>
                </div>
            `).join('');

            // 4. Attach Listeners
            
            // A. Add to Cart (Stop propagation so it doesn't open modal)
            container.querySelectorAll('.add-cart-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevents clicking the card background
                    const product = products.find(p => p.id === e.target.dataset.id);
                    CartService.addToCart(product);
                    Toast.show(`Added ${product.name} to cart`, "success");
                });
            });

            // B. Open Product Modal
            container.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const product = products.find(p => p.id === card.dataset.id);
                    if (ProductModal) {
                        ProductModal.open(product);
                    } else {
                        console.error("ProductModal is not defined. Check your imports.");
                    }
                });
            });

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p style="color: red;">Error loading products. Please try again.</p>';
        }
    }
};