import { LoggerService } from "../../../services/loggerService";

export const LogView = {
    template: `
        <div class="page-header">
            <h1>System Audit Logs</h1>
            <button id="refreshLogsBtn" class="btn-primary" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                🔄 Refresh Logs
            </button>
        </div>

        <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;">
            <div id="logListContainer">
                <p style="padding: 2rem; color: #64748b;">Loading system logs...</p>
            </div>
        </div>
    `,

    async init() {
        console.log("Log View Initialized");
        const container = document.getElementById('logListContainer');
        const refreshBtn = document.getElementById('refreshLogsBtn');

        // 1. Attach Event Listener
        refreshBtn.addEventListener('click', () => this.loadLogs(container));

        // 2. Load Data on Startup
        await this.loadLogs(container);
    },

    // Helper: Fetch and Render
    async loadLogs(container) {
        container.innerHTML = '<p style="padding: 2rem;">Refreshing data...</p>';
        
        try {
            const logs = await LoggerService.getLogs();

            if (logs.length === 0) {
                container.innerHTML = '<p style="padding: 2rem;">No system logs found.</p>';
                return;
            }

            // Render Table
            const rows = logs.map(log => {
                // Format timestamp safely
                const timeString = log.timestamp ? log.timestamp.toLocaleString() : 'N/A';
                
                // Color code actions
                const color = log.action.includes('CREATED') ? 'green' : 
                              log.action.includes('ERROR') ? 'red' : 'blue';

                return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 1rem; color: #64748b; font-size: 0.9rem;">${timeString}</td>
                        <td style="padding: 1rem; font-weight: bold; color: ${color};">${log.action}</td>
                        <td style="padding: 1rem;">${log.performedBy}</td>
                        <td style="padding: 1rem; color: #475569;">${log.details}</td>
                    </tr>
                `;
            }).join('');

            container.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <tr>
                            <th style="padding: 1rem;">Timestamp</th>
                            <th style="padding: 1rem;">Action</th>
                            <th style="padding: 1rem;">User</th>
                            <th style="padding: 1rem;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error(error);
            container.innerHTML = `<p style="padding: 2rem; color: var(--danger-color);">Failed to load logs. check console.</p>`;
        }
    }
};