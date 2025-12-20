import { ShopService } from "../../../services/shopService";

export const ShopView = {
    template: `
        <div class="page-header">
            <h1>Shop Management</h1>
            <button class="btn-primary" id="openShopModalBtn" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                + Add New Shop
            </button>
        </div>

        <div id="shopFormContainer" style="display: none; background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <h3>Add New Shop</h3>
            <form id="addShopForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                
                <div style="grid-column: span 2;">
                    <label>Shop Name</label>
                    <input type="text" name="name" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div>
                    <label>Shop Number</label>
                    <input type="text" name="shopNumber" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div>
                    <label>Floor</label>
                    <select name="floor" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="Ground">Ground Floor</option>
                        <option value="1st">1st Floor</option>
                        <option value="2nd">2nd Floor</option>
                        <option value="3rd">3rd Floor</option>
                    </select>
                </div>

                <div>
                    <label>Category</label>
                    <input type="text" name="category" placeholder="e.g. Fashion, Food" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div>
                    <label>Owner Name</label>
                    <input type="text" name="ownerName" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>

                <div style="grid-column: span 2; display: flex; gap: 10px; margin-top: 10px;">
                    <button type="submit" style="background: var(--success-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Save Shop</button>
                    <button type="button" id="cancelBtn" style="background: var(--secondary-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </form>
        </div>

        <div id="shopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <p>Loading shops...</p>
        </div>
    `,

    async init() {
        console.log("Shop View Initialized");

        // DOM Elements
        const formContainer = document.getElementById('shopFormContainer');
        const openBtn = document.getElementById('openShopModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('addShopForm');
        const listContainer = document.getElementById('shopList');

        // 1. Toggle Form Visibility
        openBtn.addEventListener('click', () => formContainer.style.display = 'block');
        cancelBtn.addEventListener('click', () => formContainer.style.display = 'none');

        // 2. Handle Form Submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');

            const shopData = {
                name: formData.get('name'),
                shopNumber: formData.get('shopNumber'),
                floor: formData.get('floor'),
                category: formData.get('category'),
                ownerName: formData.get('ownerName')
            };

            try {
                // Disable button and change text
                submitBtn.disabled = true;
                submitBtn.textContent = "Saving...";

                await ShopService.addShop(shopData);

                alert("✅ Shop Added Successfully!");
                form.reset();
                formContainer.style.display = 'none';
                this.loadShops(listContainer);

            } catch (error) {
                // Show error message
                alert("⚠️ " + error.message);
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = "Save Shop";
            }
        });

        // 3. Load Data on Startup
        await this.loadShops(listContainer);
    },

    // Helper: Fetch and Render
    async loadShops(container) {
        container.innerHTML = '<p>Loading...</p>';
        try {
            const shops = await ShopService.getAllShops();

            if (shops.length === 0) {
                container.innerHTML = '<p>No shops found. Add one!</p>';
                return;
            }

            container.innerHTML = shops.map(shop => `
    <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-left: 5px solid var(--primary-color); position: relative;">
        <button class="delete-shop-btn" data-id="${shop.id}" 
            style="position: absolute; top: 10px; right: 10px; background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
            🗑️ Delete
        </button>

        <h3 style="margin-bottom: 0.5rem; padding-right: 2rem;">${shop.name}</h3>
        <p style="color: #64748b; font-size: 0.9rem;">${shop.category} | ${shop.floor} Floor</p>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;">#${shop.shopNumber}</span>
            <span style="font-size: 0.8rem; background: #e2e8f0; padding: 2px 8px; border-radius: 10px;">${shop.status}</span>
        </div>
    </div>
`).join('');

            // Add Event Listeners for Delete
            container.querySelectorAll('.delete-shop-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this shop? This cannot be undone.')) {
                        try {
                            const id = e.target.dataset.id;
                            await ShopService.deleteShop(id);
                            // Reload list
                            this.loadShops(container);
                        } catch (err) {
                            alert("Failed to delete");
                        }
                    }
                });
            });

        } catch (error) {
            container.innerHTML = `<p style="color: red">Failed to load shops.</p>`;
        }
    }
};