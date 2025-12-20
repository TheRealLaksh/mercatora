import { CartService } from "../../services/cartService";
import { Toast } from "../common/toast";

export const ProductModal = {
    template: `
        <div id="prodModalOverlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
            <div class="glass-card" style="width: 90%; max-width: 500px; padding: 0; background: var(--card-bg); animation: popIn 0.3s ease;">
                <div style="height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #cbd5e1;">
                    📷
                </div>
                <div style="padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <h2 id="pmName" style="margin: 0;">Product Name</h2>
                        <span id="pmPrice" style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">₹0</span>
                    </div>
                    
                    <p id="pmShop" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Shop Name</p>
                    <p id="pmDesc" style="color: var(--text-color); line-height: 1.6; margin-bottom: 2rem;">Description goes here...</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button id="pmClose" style="padding: 12px; background: transparent; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; color: var(--text-color);">Close</button>
                        <button id="pmAdd" style="padding: 12px; background: var(--primary-color); border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
        <style>@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>
    `,

    init() {
        if (!document.getElementById('prodModalOverlay')) {
            const div = document.createElement('div');
            div.innerHTML = this.template;
            document.body.appendChild(div.firstElementChild);
            document.body.appendChild(div.lastElementChild); // Append style tag
        }
        
        this.overlay = document.getElementById('prodModalOverlay');
        this.closeBtn = document.getElementById('pmClose');
        this.addBtn = document.getElementById('pmAdd');
        
        // Close handlers
        this.closeBtn.onclick = () => this.close();
        this.overlay.onclick = (e) => { if(e.target === this.overlay) this.close(); };
    },

    open(product) {
        this.init(); // Ensure elements exist
        
        // Populate Data
        document.getElementById('pmName').textContent = product.name;
        document.getElementById('pmPrice').textContent = `₹${product.price}`;
        document.getElementById('pmShop').textContent = `Sold by: ${product.shopName || 'Unknown Shop'}`;
        document.getElementById('pmDesc').textContent = product.description || 'No description available for this product.';
        
        // Setup Add Button
        this.addBtn.onclick = () => {
            CartService.addToCart(product);
            Toast.show(`Added ${product.name} to cart`, "success");
            this.close();
        };

        this.overlay.style.display = 'flex';
    },

    close() {
        if(this.overlay) this.overlay.style.display = 'none';
    }
};