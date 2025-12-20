import { ShopService } from "../../../services/shopService";
import { ProductService } from "../../../services/productService";

export const DashboardView = {
    template: `
        <div class="page-header">
            <h1>Dashboard Overview</h1>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 3rem;">
            <div class="glass-card" style="padding: 1.5rem; border-left: 5px solid var(--primary-color);">
                <p style="color: var(--text-muted); font-size: 0.9rem;">Total Shops</p>
                <h2 style="font-size: 2.5rem;" id="statShops">-</h2>
            </div>
            <div class="glass-card" style="padding: 1.5rem; border-left: 5px solid var(--success-color);">
                <p style="color: var(--text-muted); font-size: 0.9rem;">Total Products</p>
                <h2 style="font-size: 2.5rem;" id="statProducts">-</h2>
            </div>
            <div class="glass-card" style="padding: 1.5rem; border-left: 5px solid var(--accent-color);">
                <p style="color: var(--text-muted); font-size: 0.9rem;">Low Stock Alerts</p>
                <h2 style="font-size: 2.5rem;" id="statAlerts">-</h2>
            </div>
        </div>
    `,

    async init() {
        try {
            const shops = await ShopService.getAllShops();
            const products = await ProductService.getAllProducts();
            
            // Calculate stats
            const lowStock = products.filter(p => p.stock < 10).length;

            document.getElementById('statShops').textContent = shops.length;
            document.getElementById('statProducts').textContent = products.length;
            document.getElementById('statAlerts').textContent = lowStock;
        } catch (e) {
            console.error(e);
        }
    }
};