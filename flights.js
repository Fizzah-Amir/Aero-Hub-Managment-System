class FlightManager {
    constructor() {
        this.api = window.FlightAPI;
        this.currentTimeRange = { start: '14:00', end: '17:00' };
    }

    async loadFlights() {
        try {
            const response = await this.api.getAllFlights();
            this.renderFlights(response.flights);
        } catch (error) {
            console.error('Error loading flights:', error);
        }
    }

    async loadFlightsByTimeRange() {
        const loader = document.getElementById('flights-loader');
        const table = document.getElementById('flights-table');
        
        if (loader) loader.classList.add('active');
        if (table) table.innerHTML = '';
        
        try {
            // Update current time range from UI if available
            const startTimeSelect = document.getElementById('start-time');
            const endTimeSelect = document.getElementById('end-time');
            
            if (startTimeSelect) this.currentTimeRange.start = startTimeSelect.value;
            if (endTimeSelect) this.currentTimeRange.end = endTimeSelect.value;
            
            const response = await this.api.getFlightsByTimeRange(
                this.currentTimeRange.start,
                this.currentTimeRange.end
            );
            
            this.renderFlights(response.flights || []);
            
            // Show query info
            const queryInfo = document.getElementById('query-info');
            if (queryInfo) {
                queryInfo.innerHTML = `
                    ✅ Showing ${response.count || 0} flights (Time Range: ${this.currentTimeRange.start} to ${this.currentTimeRange.end})
                `;
            }
        } catch (error) {
            this.showError('Failed to load flights: ' + error.message);
        } finally {
            if (loader) loader.classList.remove('active');
        }
    }

    renderFlights(flights) {
        const tbody = document.getElementById('flights-table');
        if (!tbody) return;
        
        if (!flights || flights.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <i class="fas fa-plane-slash" style="font-size: 48px; color: #9ca3af; margin-bottom: 15px;"></i>
                        <div>No flights found in selected time range</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = flights.map(flight => `
            <tr>
                <td>
                    <strong>${flight.flightNumber}</strong><br>
                    <small style="color: #6b7280;">${flight.airline || 'Unknown Airline'}</small>
                </td>
                <td>${flight.origin || 'N/A'}</td>
                <td>${flight.destination || 'N/A'}</td>
                <td>
                    <div style="font-weight: 600;">${flight.departureTime || 'N/A'}</div>
                    <small style="color: #6b7280;">Gate ${flight.gate || 'N/A'}</small>
                </td>
                <td>
                    <span class="status on-time">ON TIME</span>
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" 
                            onclick="flightsManager.viewFlight('${flight.flightNumber}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${window.app && window.app.permissions && window.app.permissions.canCancelFlights ? `
                        <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" 
                                onclick="flightsManager.cancelFlight('${flight.flightNumber}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async viewFlight(flightNumber) {
        try {
            const response = await this.api.getFlight(flightNumber);
            this.showFlightDetails(response.flight);
        } catch (error) {
            this.showError('Flight not found: ' + error.message);
        }
    }

    showFlightDetails(flight) {
        const modalHtml = `
            <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Flight Details</h3>
                        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    <div style="display: grid; gap: 15px;">
                        <div><strong>Flight:</strong> ${flight.flightNumber}</div>
                        <div><strong>Airline:</strong> ${flight.airline || 'N/A'}</div>
                        <div><strong>Route:</strong> ${flight.origin || 'N/A'} → ${flight.destination || 'N/A'}</div>
                        <div><strong>Departure:</strong> ${flight.departureTime || 'N/A'}</div>
                        <div><strong>Arrival:</strong> ${flight.arrivalTime || 'N/A'}</div>
                        <div><strong>Gate:</strong> ${flight.gate || 'N/A'}</div>
                        <div><strong>Seats:</strong> ${flight.seats || 180} total</div>
                        <div><strong>Price:</strong> $${flight.price || 500}</div>
                    </div>
                    <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn" onclick="flightsManager.loadSeatMap('${flight.flightNumber}')">
                            <i class="fas fa-chair"></i> View Seats
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async cancelFlight(flightNumber) {
        if (!confirm(`Are you sure you want to cancel flight ${flightNumber}?`)) return;
        
        try {
            await this.api.deleteFlight(flightNumber);
            
            // Log the activity if app exists
            if (window.app && window.app.logActivity) {
                window.app.logActivity('FLIGHT_CANCELLED', {
                    flightNumber: flightNumber,
                    user: window.app.currentUser?.name,
                    role: window.app.userRole
                });
            }
            
            this.showSuccess(`Flight ${flightNumber} cancelled successfully`);
            await this.loadFlightsByTimeRange();
        } catch (error) {
            this.showError('Failed to cancel flight: ' + error.message);
        }
    }

    showAddFlightForm() {
        const container = document.getElementById('add-flight-form-container');
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card">
                <h3><i class="fas fa-plus"></i> Add New Flight</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                    <div>
                        <label>Flight Number *</label>
                        <input type="text" id="add-flight-number" placeholder="AA101" class="form-control" required>
                    </div>
                    <div>
                        <label>Airline *</label>
                        <input type="text" id="add-airline" placeholder="Airline Name" class="form-control" required>
                    </div>
                    <div>
                        <label>Origin *</label>
                        <input type="text" id="add-origin" placeholder="JFK" class="form-control" required>
                    </div>
                    <div>
                        <label>Destination *</label>
                        <input type="text" id="add-destination" placeholder="LHR" class="form-control" required>
                    </div>
                    <div>
                        <label>Departure Time *</label>
                        <input type="time" id="add-departure" value="14:30" class="form-control" required>
                    </div>
                    <div>
                        <label>Arrival Time</label>
                        <input type="time" id="add-arrival" value="22:00" class="form-control">
                    </div>
                </div>
                <div style="margin-top: 25px; display: flex; gap: 10px;">
                    <button class="btn btn-success" onclick="flightsManager.addNewFlight()">
                        <i class="fas fa-check"></i> Add Flight
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('add-flight-form-container').style.display = 'none'">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    async addNewFlight() {
        const flightNumber = document.getElementById('add-flight-number').value;
        const airline = document.getElementById('add-airline').value;
        const origin = document.getElementById('add-origin').value;
        const destination = document.getElementById('add-destination').value;
        const departureTime = document.getElementById('add-departure').value;
        const arrivalTime = document.getElementById('add-arrival').value;
        
        if (!flightNumber || !airline || !origin || !destination || !departureTime) {
            this.showError('Please fill all required fields (*)');
            return;
        }

        const flightData = {
            flightNumber,
            airline,
            origin,
            destination,
            departureTime,
            arrivalTime: arrivalTime || '',
            status: 'Scheduled'
        };

        try {
            await this.api.addFlight(flightData);
            
            // Log the activity if app exists
            if (window.app && window.app.logActivity) {
                window.app.logActivity('FLIGHT_ADDED', {
                    flightNumber: flightNumber,
                    user: window.app.currentUser?.name,
                    role: window.app.userRole
                });
            }
            
            this.showSuccess('Flight added successfully!');
            document.getElementById('add-flight-form-container').style.display = 'none';
            await this.loadFlightsByTimeRange();
        } catch (error) {
            this.showError('Failed to add flight: ' + error.message);
        }
    }

    async loadSeatMap(flightNumber) {
        try {
            const seatMap = await this.api.getSeatMap(flightNumber);
            this.showSeatMapModal(seatMap);
        } catch (error) {
            this.showError('Failed to load seat map: ' + error.message);
        }
    }

    showSeatMapModal(seatMap) {
        const modalHtml = `
            <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 800px; width: 95%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Seat Map - Flight ${seatMap.flightNumber}</h3>
                        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <div>Available: ${seatMap.availableSeats || 0}/${seatMap.totalSeats || 0} seats</div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; max-height: 400px; overflow-y: auto;">
                        ${(seatMap.seatMap || []).map(seat => `
                            <div style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px; text-align: center;
                                 background: ${seat.available ? '#dcfce7' : '#fee2e2'};">
                                ${seat.seatNumber || 'N/A'}<br>
                                <small>${seat.available ? 'Available' : 'Occupied'}</small>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
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
}

// Initialize when on flights page
if (document.querySelector('.flights-page')) {
    window.flightsManager = new FlightManager();
    
    // Set up event listeners
    document.addEventListener('DOMContentLoaded', () => {
        const searchBtn = document.querySelector('button[onclick*="loadFlightsByTimeRange"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (window.flightsManager) {
                    window.flightsManager.loadFlightsByTimeRange();
                }
            });
        }
        
        // Load flights after a short delay
        setTimeout(() => {
            if (window.flightsManager) {
                window.flightsManager.loadFlightsByTimeRange();
            }
        }, 100);
    });
}