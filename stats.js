 class StatsManager {
    constructor() {
        this.api = window.FlightAPI;
    }

    async loadStats() {
        try {
            const stats = await this.api.getStats();
            this.renderStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats(statsData) {
        const stats = statsData.stats;
        
        // System Overview
        document.getElementById('system-overview').innerHTML = `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <h3><i class="fas fa-plane"></i> Active Flights</h3>
                    <div class="number">${stats.totalFlights}</div>
                    <div class="label">Currently scheduled</div>
                </div>
                
                <div class="stat-card">
                    <h3><i class="fas fa-users"></i> Total Passengers</h3>
                    <div class="number">${stats.totalPassengers}</div>
                    <div class="label">In system</div>
                </div>
                
                <div class="stat-card">
                    <h3><i class="fas fa-check-circle"></i> Checked-in</h3>
                    <div class="number">${stats.checkedInPassengers}</div>
                    <div class="label">Ready to board</div>
                </div>
                
                <div class="stat-card">
                    <h3><i class="fas fa-chair"></i> Seat Availability</h3>
                    <div class="number">${stats.availableSeats}</div>
                    <div class="label">Available seats</div>
                </div>
            </div>
        `;

        // System Performance
        document.getElementById('system-performance').innerHTML = `
            <div class="card">
                <h3><i class="fas fa-tachometer-alt"></i> System Performance</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Server Uptime</div>
                        <div style="font-size: 24px; font-weight: 600;">24/7</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Connections Handled</div>
                        <div style="font-size: 24px; font-weight: 600;">${stats.connectionsHandled}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Requests Processed</div>
                        <div style="font-size: 24px; font-weight: 600;">${stats.requestsProcessed}</div>
                    </div>
                </div>
            </div>
        `;

        // Current Load
        document.getElementById('current-load').innerHTML = `
            <div class="card">
                <h3><i class="fas fa-chart-line"></i> Current System Load</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="background: #f0f9ff; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #0ea5e9; margin-bottom: 10px;">234</div>
                        <div style="font-size: 14px; color: #6b7280;">Check-ins/hour</div>
                    </div>
                    <div style="background: #f0fdf4; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #10b981; margin-bottom: 10px;">12</div>
                        <div style="font-size: 14px; color: #6b7280;">Flight updates</div>
                    </div>
                    <div style="background: #fef3c7; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #f59e0b; margin-bottom: 10px;">5</div>
                        <div style="font-size: 14px; color: #6b7280;">Gate changes</div>
                    </div>
                    <div style="background: #fef2f2; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #ef4444; margin-bottom: 10px;">8</div>
                        <div style="font-size: 14px; color: #6b7280;">Route queries</div>
                    </div>
                </div>
            </div>
        `;

        // Data Structures Info (without time complexities)
        document.getElementById('data-structures-info').innerHTML = `
            <div class="card">
                <h3><i class="fas fa-database"></i> Data Structures in Use</h3>
                <div style="margin-top: 20px;">
                    <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                             border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-sitemap" style="color: white;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">B-Tree for Flight Scheduling</div>
                            <div style="font-size: 14px; color: #6b7280;">Efficient time-based flight queries</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); 
                             border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-hashtag" style="color: white;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">Hash Table for Passenger Lookup</div>
                            <div style="font-size: 14px; color: #6b7280;">Instant passenger check-in by PNR</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e5e7eb;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                             border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-th" style="color: white;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">Bitmap for Seat Management</div>
                            <div style="font-size: 14px; color: #6b7280;">Compact seat availability tracking</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; padding: 15px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                             border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-project-diagram" style="color: white;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">Graph for Route Optimization</div>
                            <div style="font-size: 14px; color: #6b7280;">Optimal flight path finding</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async exportReport() {
        try {
            const stats = await this.api.getStats();
            
            const report = {
                generatedAt: new Date().toISOString(),
                systemOverview: {
                    totalFlights: stats.stats.totalFlights,
                    totalPassengers: stats.stats.totalPassengers,
                    checkedInPassengers: stats.stats.checkedInPassengers,
                    availableSeats: stats.stats.availableSeats,
                    totalRoutes: stats.stats.totalRoutes
                },
                performance: {
                    connectionsHandled: stats.stats.connectionsHandled,
                    requestsProcessed: stats.stats.requestsProcessed,
                    serverStartTime: stats.stats.serverStartTime
                }
            };
            
            const dataStr = JSON.stringify(report, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `airport-system-report-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showMessage('success', 'Report exported successfully');
        } catch (error) {
            this.showMessage('error', 'Failed to export report: ' + error.message);
        }
    }

    showMessage(type, text) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <div>${text}</div>
        `;
        
        document.querySelector('.content').prepend(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
}

// Initialize when on stats page
if (document.querySelector('.stats-page')) {
    window.statsManager = new StatsManager();
    statsManager.loadStats();
    
    // Setup refresh button
    document.getElementById('refresh-stats').addEventListener('click', () => {
        statsManager.loadStats();
        statsManager.showMessage('info', 'Statistics refreshed');
    });
    
    // Setup export button
    document.getElementById('export-report').addEventListener('click', () => {
        statsManager.exportReport();
    });
}