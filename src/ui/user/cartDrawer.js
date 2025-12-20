import { CartService } from "../../services/cartService";
import { Toast } from "../common/toast";

export const CartDrawer = {
  template: `
    <div class="cart-overlay" id="cartOverlay"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Your Cart 🛒</h2>
        <button id="closeCartBtn" style="background:none; border:none; font-size: 1.5rem; cursor:pointer;">&times;</button>
      </div>
      <div id="cartItems" style="flex: 1; overflow-y: auto;"></div>
      <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <h3 style="display: flex; justify-content: space-between;">Total: <span id="cartTotal">₹0</span></h3>
        <button id="checkoutBtn" style="width: 100%; background: var(--primary-color); color: white; padding: 12px; border: none; border-radius: 8px; margin-top: 1rem; cursor: pointer; font-weight: bold;">Checkout</button>
      </div>
    </div>
  `,
  
  init() {
    this.renderItems();
    // Listen for updates
    window.addEventListener('cart-updated', () => this.renderItems());
    
    document.getElementById('closeCartBtn').addEventListener('click', this.close);
    document.getElementById('cartOverlay').addEventListener('click', this.close);
    
    // UPDATED CHECKOUT LOGIC WITH MODAL
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        const cart = CartService.getCart();
        if (cart.length === 0) {
            Toast.show("Your cart is empty!", "error");
            return;
        }

        // 1. Create Modal HTML
        const dialogHTML = `
            <div id="checkoutModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 3000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
                <div class="glass-card" style="background: var(--card-bg); padding: 2rem; width: 90%; max-width: 400px; animation: slideIn 0.3s ease;">
                    <h2>Confirm Order</h2>
                    <p style="margin-bottom: 1rem; color: var(--text-muted);">Enter your details to place the order.</p>
                    
                    <input type="text" placeholder="Your Name" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--background-color); color: var(--text-color);">
                    <input type="text" placeholder="Table No / Address" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--background-color); color: var(--text-color);">
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="cancelOrder" style="flex: 1; padding: 10px; background: transparent; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; color: var(--text-color);">Cancel</button>
                        <button id="confirmOrder" style="flex: 1; padding: 10px; background: var(--success-color); border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer;">Place Order</button>
                    </div>
                </div>
            </div>
        `;

        // 2. Inject into DOM
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // 3. Handle Cancel
        document.getElementById('cancelOrder').onclick = () => {
            document.getElementById('checkoutModal').remove();
        };
        
        // 4. Handle Confirm
        document.getElementById('confirmOrder').onclick = () => {
            // Here you would normally send data to backend
            CartService.clearCart();
            document.getElementById('checkoutModal').remove();
            this.close(); // Close the drawer
            Toast.show("🎉 Order placed! We'll be there soon.", "success");
        };
    });
  },
  
  open() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
  },
  
  close() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
  },
  
  renderItems() {
    const cart = CartService.getCart();
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
      totalEl.textContent = '₹0';
      return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
      total += item.price * item.qty;
      return `
        <div style="display: flex; gap: 10px; margin-bottom: 1rem; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
          <div style="width: 50px; height: 50px; background: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🛍️</div>
          <div style="flex: 1;">
            <h4 style="font-size: 0.95rem; margin-bottom: 2px;">${item.name}</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">₹${item.price} x ${item.qty}</p>
          </div>
          <span style="font-weight: bold; color: var(--primary-color);">₹${item.price * item.qty}</span>
        </div>
      `;
    }).join('');
    
    totalEl.textContent = `₹${total}`;
  }
};