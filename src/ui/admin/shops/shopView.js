export const ShopView = {
    template: `
        <div class="page-header">
            <h1>Shop Management</h1>
            <button class="btn-primary" id="addShopBtn">+ Add New Shop</button>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 8px;">
            <p>Shop list will appear here...</p>
        </div>
    `,
    init() {
        console.log("Shop View Initialized");
        // Logic to load shops will go here later
    }
};