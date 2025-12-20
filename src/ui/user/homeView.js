export const HomeView = {
    template: `
        <div class="hero" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1519567241046-7f570eee3c9f?auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; padding: 4rem 2rem; border-radius: 0 0 30px 30px; color: white; text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">Mercatora</h1>
            <p style="font-size: 1.2rem; opacity: 0.9;">Shop. Eat. Play. Repeat.</p>
        </div>

        <div class="container" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 1rem; margin-bottom: 1rem;">
            <button class="pill active" data-cat="all" style="padding: 8px 20px; border-radius: 20px; border: none; background: var(--primary-color); color: white; cursor: pointer;">All</button>
            <button class="pill" data-cat="Fashion" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Fashion</button>
            <button class="pill" data-cat="Electronics" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Electronics</button>
            <button class="pill" data-cat="Food" style="padding: 8px 20px; border-radius: 20px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); cursor: pointer;">Food</button>
        </div>

        <div class="container" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">Happening Now 🔥</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                <div style="background: linear-gradient(45deg, #ff9a9e, #fad0c4); padding: 1.5rem; border-radius: 12px; color: white;">
                    <h4>Black Friday Sale</h4>
                    <p>Up to 50% off on all Fashion stores!</p>
                </div>
                <div style="background: linear-gradient(45deg, #a18cd1, #fbc2eb); padding: 1.5rem; border-radius: 12px; color: white;">
                    <h4>Live Music @ Food Court</h4>
                    <p>Tonight at 7 PM. Don't miss out.</p>
                </div>
            </div>
        </div>

        <div class="container">
            <h2 style="margin-bottom: 1rem;">Directory</h2>
            <div id="publicShopList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
                <p>Loading Directory...</p>
            </div>
        </div>
    `,

    async init(params) {
        const { onNavigateToShop } = params; 
        const container = document.getElementById('publicShopList');
        
        let allShops = [];
        try {
            allShops = (await ShopService.getAllShops()).filter(s => s.status === 'active');
            this.renderShops(allShops, container, onNavigateToShop);
        } catch (error) {
            container.innerHTML = '<p>System currently unavailable.</p>';
        }

        // Pill Navigation Logic
        document.querySelectorAll('.pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active style
                document.querySelectorAll('.pill').forEach(b => {
                    b.style.background = 'var(--card-bg)';
                    b.style.color = 'var(--text-color)';
                });
                e.target.style.background = 'var(--primary-color)';
                e.target.style.color = 'white';

                // Filter logic
                const cat = e.target.dataset.cat;
                const filtered = cat === 'all' ? allShops : allShops.filter(s => s.category.includes(cat));
                this.renderShops(filtered, container, onNavigateToShop);
            });
        });
    },

    renderShops(shops, container, onNavigate) {
        if (shops.length === 0) {
            container.innerHTML = '<p>No shops found.</p>';
            return;
        }

        container.innerHTML = shops.map(shop => {
            const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1); // Fake rating for MVP
            return `
            <div class="glass-card">
                <div style="background: var(--primary-color); height: 100px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.3); font-size: 2rem;">🏬</div>
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary-color); font-weight: bold;">${shop.category}</span>
                        <span style="color: var(--accent-color);">⭐ ${rating}</span>
                    </div>
                    <h3 style="margin: 0.5rem 0; font-size: 1.25rem;">${shop.name}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">Floor: ${shop.floor}</p>
                    
                    <button class="view-shop-btn" data-id="${shop.id}" 
                        style="width: 100%; padding: 10px; background: var(--background-color); border: 1px solid var(--border-color); border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Visit Shop
                    </button>
                </div>
            </div>
        `}).join('');

        container.querySelectorAll('.view-shop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shop = shops.find(s => s.id === e.target.dataset.id);
                onNavigate(shop);
            });
        });
    }
};