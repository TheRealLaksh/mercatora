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
    
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      CartService.clearCart();
      this.close();
      Toast.show("🎉 Order placed successfully!", "success");
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
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Your cart is empty.</p>';
      totalEl.textContent = '₹0';
      return;
    }
    
    let total = 0;
    container.innerHTML = cart.map(item => {
      total += item.price * item.qty;
      return `
        <div style="display: flex; gap: 10px; margin-bottom: 1rem; align-items: center;">
          <div style="width: 50px; height: 50px; background: #eee; border-radius: 4px;"></div>
          <div style="flex: 1;">
            <h4 style="font-size: 0.9rem;">${item.name}</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">₹${item.price} x ${item.qty}</p>
          </div>
          <span style="font-weight: bold;">₹${item.price * item.qty}</span>
        </div>
      `;
    }).join('');
    
    totalEl.textContent = `₹${total}`;
  }
};