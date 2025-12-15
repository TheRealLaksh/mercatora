export const ProductView = {
    template: `
        <div class="page-header">
            <h1>Product Inventory</h1>
            <button class="btn-primary" id="addProductBtn">+ Add New Product</button>
        </div>
        <div style="background: white; padding: 2rem; border-radius: 8px;">
            <p>Product list will appear here...</p>
        </div>
    `,
    init() {
        console.log("Product View Initialized");
    }
};