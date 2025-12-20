export const CartService = {
  getCart() {
    return JSON.parse(localStorage.getItem('mercatora_cart')) || [];
  },
  
  addToCart(product) {
    const cart = this.getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    localStorage.setItem('mercatora_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated')); // Notify UI
  },
  
  clearCart() {
    localStorage.removeItem('mercatora_cart');
    window.dispatchEvent(new Event('cart-updated'));
  }
};