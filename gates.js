class GateManager {
    constructor() {
        this.api = window.FlightAPI;
        this.gates = [];
    }

    async loadGates() {
        try {
            const response = await this.api.getAllGates();
            this.gates = response.gates || [];
            this.renderGates();
            
            // Update statistics
            this.updateGateStatistics();
            
        } catch (error) {
            console.error('Error loading gates:', error);
            this.showError('Failed to load gates: ' + error.message);
        }
    }

    updateGateStatistics() {
        const availableCount = this.gates.filter(g => !g.occupied).length;
        const availableGatesCount = document.getElementById('available-gates-count');
        if (availableGatesCount) {
            availableGatesCount.textContent = availableCount;
        }
    }

    renderGates() {
        const container = document.getElementById('gates-container');
        if (!container) return;
        
        // Group gates by terminal
        const gatesByTerminal = {};
        this.gates.forEach(gate => {
            const terminal = gate.terminal || 'A';
            if (!gatesByTerminal[terminal]) {
                gatesByTerminal[terminal] = [];
            }
            gatesByTerminal[terminal].push(gate);
        });

        let html = '';
        
        for (const terminal in gatesByTerminal) {
            html += `
                <div class="card">
                    <h3><i class="fas fa-building"></i> Terminal ${terminal}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;">
                        ${gatesByTerminal[terminal].map(gate => this.renderGateCard(gate)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderGateCard(gate) {
        const statusClass = gate.occupied ? 'delayed' : 'on-time';
        const statusText = gate.occupied ? 'Occupied' : 'Available';
        const flightInfo = gate.currentFlight ? 
            `<div style="font-size: 12px; color: #6b7280;">Flight: ${gate.currentFlight}</div>` : '';
        
        // Check permissions
        const canAssignGates = window.app && window.app.permissions && window.app.permissions.canAssignGates;
        
        return `
            <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <div style="font-size: 20px; font-weight: 700; color: #1f2937;">${gate.gateNumber || 'N/A'}</div>
                        ${flightInfo}
                    </div>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    ${gate.occupied && canAssignGates ? `
                        <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" 
                                onclick="gateManager.releaseGate('${gate.gateNumber}')">
                            <i class="fas fa-door-open"></i> Release
                        </button>
                    ` : ''}
                    
                    ${!gate.occupied && canAssignGates ? `
                        <button class="btn" style="padding: 8px 12px; font-size: 12px;" 
                                onclick="gateManager.assignGateForm('${gate.gateNumber}')">
                            <i class="fas fa-plane-arrival"></i> Assign
                        </button>
                    ` : ''}
                    
                    ${gate.status === 'MAINTENANCE' && canAssignGates ? `
                        <button class="btn btn-warning" style="padding: 8px 12px; font-size: 12px;" 
                                onclick="gateManager.reopenGate('${gate.gateNumber}')">
                            <i class="fas fa-tools"></i> Reopen
                        </button>
                    ` : ''}
                    
                    ${gate.status !== 'MAINTENANCE' && canAssignGates ? `
                        <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" 
                                onclick="gateManager.maintenanceGate('${gate.gateNumber}')">
                            <i class="fas fa-tools"></i> Maintenance
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async releaseGate(gateNumber) {
        if (!confirm(`Release gate ${gateNumber}? This will make the gate available for other flights.`)) {
            return;
        }
        
        try {
            // Find flight using this gate
            const gate = this.gates.find(g => g.gateNumber === gateNumber);
            if (gate && gate.currentFlight) {
                // Assign empty gate to release it
                await this.api.assignGate(gate.currentFlight, '');
            }
            
            this.showSuccess(`Gate ${gateNumber} released`);
            
            // Log activity if app exists
            if (window.app && window.app.logActivity) {
                window.app.logActivity('GATE_RELEASED', {
                    gateNumber: gateNumber,
                    user: window.app.currentUser?.name,
                    role: window.app.userRole
                });
            }
            
            await this.loadGates(); // Refresh gate list
        } catch (error) {
            this.showError('Failed to release gate: ' + error.message);
        }
    }

    assignGateForm(gateNumber) {
        // Close any existing modal
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
        
        const modalHtml = `
            <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 400px; width: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Assign Flight to Gate ${gateNumber}</h3>
                        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label>Flight Number *</label>
                        <input type="text" id="assign-flight-number" placeholder="AA101" class="form-control" style="width: 100%;">
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-success" onclick="gateManager.assignGate('${gateNumber}')">
                            <i class="fas fa-check"></i> Assign
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async assignGate(gateNumber) {
        const flightNumber = document.getElementById('assign-flight-number').value.trim();
        
        if (!flightNumber) {
            this.showError('Please enter a flight number');
            return;
        }
        
        try {
            await this.api.assignGate(flightNumber, gateNumber);
            this.showSuccess(`Gate ${gateNumber} assigned to flight ${flightNumber}`);
            
            // Log activity if app exists
            if (window.app && window.app.logActivity) {
                window.app.logActivity('GATE_ASSIGNED', {
                    gateNumber: gateNumber,
                    flightNumber: flightNumber,
                    user: window.app.currentUser?.name,
                    role: window.app.userRole
                });
            }
            
            document.querySelector('.modal').remove();
            await this.loadGates(); // Refresh gate list
        } catch (error) {
            this.showError('Failed to assign gate: ' + error.message);
        }
    }

    async getAvailableGates() {
        try {
            const response = await this.api.getAvailableGates();
            this.showAvailableGatesModal(response.gates || []);
        } catch (error) {
            this.showError('Failed to load available gates: ' + error.message);
        }
    }

    showAvailableGatesModal(availableGates) {
        const modalHtml = `
            <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Available Gates (${availableGates.length})</h3>
                        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${availableGates.length === 0 ? 
                            '<div class="message info">No gates available at the moment</div>' : 
                            availableGates.map(gate => `
                                <div style="padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${gate.gateNumber}</strong><br>
                                        <small>Terminal ${gate.terminal || 'A'}</small>
                                    </div>
                                    ${window.app && window.app.permissions && window.app.permissions.canAssignGates ? `
                                        <button class="btn" onclick="gateManager.assignGateForm('${gate.gateNumber}')">
                                            Assign
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')
                        }
                    </div>
                    
                    <div style="margin-top: 25px; text-align: center;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    maintenanceGate(gateNumber) {
        if (!confirm(`Put gate ${gateNumber} under maintenance?`)) return;
        
        this.showWarning(`Gate ${gateNumber} marked for maintenance (simulated)`);
        
        // Log activity if app exists
        if (window.app && window.app.logActivity) {
            window.app.logActivity('GATE_MAINTENANCE', {
                gateNumber: gateNumber,
                user: window.app.currentUser?.name,
                role: window.app.userRole
            });
        }
    }

    reopenGate(gateNumber) {
        if (!confirm(`Reopen gate ${gateNumber} for service?`)) return;
        
        this.showSuccess(`Gate ${gateNumber} reopened (simulated)`);
        
        // Log activity if app exists
        if (window.app && window.app.logActivity) {
            window.app.logActivity('GATE_REOPENED', {
                gateNumber: gateNumber,
                user: window.app.currentUser?.name,
                role: window.app.userRole
            });
        }
    }

    showSuccess(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('success', message);
        } else {
            alert('✅ ' + message);
        }
    }

    showError(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('error', message);
        } else {
            alert('❌ ' + message);
        }
    }

    showWarning(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('warning', message);
        } else {
            alert('⚠️ ' + message);
        }
    }

    showInfo(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('info', message);
        } else {
            alert('ℹ️ ' + message);
        }
    }
}

// Initialize when on gates page
if (document.querySelector('.gates-page')) {
    window.gateManager = new GateManager();
    
    // Set up event listeners after DOM loads
    document.addEventListener('DOMContentLoaded', () => {
        // Load gates after a short delay
        setTimeout(() => {
            if (window.gateManager) {
                window.gateManager.loadGates();
            }
        }, 100);
        
        // Setup "Find Available Gate" button if it exists
        const findAvailableBtn = document.querySelector('button[onclick*="getAvailableGates"]');
        if (findAvailableBtn) {
            findAvailableBtn.addEventListener('click', () => {
                if (window.gateManager) {
                    window.gateManager.getAvailableGates();
                }
            });
        }
    });
}