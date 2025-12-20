import { ProductService } from "../../../services/productService";
import { ShopService } from "../../../services/shopService";

export const ProductView = {
    template: `
        <div class="page-header">
            <h1>Product Inventory</h1>
            <button class="btn-primary" id="openProductModalBtn" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                + Add New Product
            </button>
        </div>

        <div id="productFormContainer" style="display: none; background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <h3>Add New Product</h3>
            <form id="addProductForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                
                <div style="grid-column: span 2;">
                    <label>Select Shop</label>
                    <select id="shopSelect" name="shopId" required style="width: 100%; padding: 8px; margin-top: 5px; background: #f8fafc;">
                        <option value="">Loading shops...</option>
                    </select>
                </div>

                <div style="grid-column: span 2;">
                    <label>Product Name</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div>
                    <label>Price (₹)</label>
                    <input type="number" name="price" step="0.01" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div>
                    <label>Stock Qty</label>
                    <input type="number" name="stock" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div style="grid-column: span 2;">
                    <label>Description</label>
                    <textarea name="description" rows="2" style="width: 100%; padding: 8px; margin-top: 5px;"></textarea>
                </div>

                <div style="grid-column: span 2; display: flex; gap: 10px; margin-top: 10px;">
                    <button type="submit" style="background: var(--success-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Save Product</button>
                    <button type="button" id="cancelProductBtn" style="background: var(--secondary-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </form>
        </div>

        <div id="productList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
            <p>Loading inventory...</p>
        </div>
    `,

    async init() {
        console.log("Product View Initialized");
        
        const formContainer = document.getElementById('productFormContainer');
        const openBtn = document.getElementById('openProductModalBtn');
        const cancelBtn = document.getElementById('cancelProductBtn');
        const form = document.getElementById('addProductForm');
        const listContainer = document.getElementById('productList');
        const shopSelect = document.getElementById('shopSelect');

        // 1. Load Shops into Dropdown
        try {
            const shops = await ShopService.getAllShops();
            shopSelect.innerHTML = '<option value="">-- Select a Shop --</option>' + 
                shops.map(s => `<option value="${s.id}">${s.name} (#${s.shopNumber})</option>`).join('');
        } catch (e) {
            shopSelect.innerHTML = '<option>Error loading shops</option>';
        }

        // 2. Event Listeners
        openBtn.addEventListener('click', () => formContainer.style.display = 'block');
        cancelBtn.addEventListener('click', () => formContainer.style.display = 'none');

        // 3. Handle Submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');

            // Grab the selected text for display purposes
            const selectedShopOption = shopSelect.options[shopSelect.selectedIndex].text;

            const productData = {
                shopId: formData.get('shopId'),
                shopName: selectedShopOption,
                name: formData.get('name'),
                price: formData.get('price'),
                stock: formData.get('stock'),
                description: formData.get('description')
            };

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = "Saving...";

                await ProductService.addProduct(productData);
                
                alert("✅ Product Added Successfully!");
                form.reset();
                formContainer.style.display = 'none';
                this.loadProducts(listContainer);

            } catch (error) {
                alert("⚠️ " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Save Product";
            }
        });

        // 4. Load Products
        await this.loadProducts(listContainer);
    },

    async loadProducts(container) {
        container.innerHTML = '<p>Loading...</p>';
        try {
            const products = await ProductService.getAllProducts();

            if (products.length === 0) {
                container.innerHTML = '<p>No products found.</p>';
                return;
            }

            container.innerHTML = products.map(p => `
                <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-top: 4px solid var(--accent-color); position: relative;">
                    <button class="delete-prod-btn" data-id="${p.id}" 
                        style="position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.5;">
                        &times;
                    </button>
                    
                    <h4 style="margin-bottom: 0.25rem; padding-right: 15px;">${p.name}</h4>
                    <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 0.5rem;">${p.shopName || 'Unknown Shop'}</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                        <span style="color: var(--primary-color);">₹${p.price}</span>
                        <span style="font-size: 0.8rem; color: ${p.stock < 10 ? 'red' : 'green'};">
                            ${p.stock} in stock
                        </span>
                    </div>
                </div>
            `).join('');

            // Attach Delete Listeners
            container.querySelectorAll('.delete-prod-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Delete this product?')) {
                        try {
                            await ProductService.deleteProduct(e.target.dataset.id);
                            this.loadProducts(container);
                        } catch (err) {
                            alert("Failed to delete product.");
                        }
                    }
                });
            });

        } catch (error) {
            container.innerHTML = '<p>Error loading inventory.</p>';
        }
    }
};