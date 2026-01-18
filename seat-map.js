// frontend/js/seat-map.js - CORRECTED VERSION
console.log("✅ seat-map.js loaded");

class SeatMapUI {
    constructor() {
        console.log("🔧 SeatMapUI constructor called");
        this.seatMapDiv = document.getElementById('seat-map');
        this.seats = [];
        this.selectedSeat = null;
        this.currentFlight = null;
        this.currentPnr = null;
        this.api = window.FlightAPI || window.api;
    }

    async loadSeatMap(flightNumber, pnr = null) {
        console.log(`💺 loadSeatMap called: flight=${flightNumber}, pnr=${pnr}`);
        
        this.currentFlight = flightNumber;
        this.currentPnr = pnr;
        
        if (!this.seatMapDiv) {
            console.error("❌ seat-map element not found!");
            return;
        }
        
        try {
            // Show loading
            this.seatMapDiv.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <p>Loading seat map for flight ${flightNumber}...</p>
                </div>
            `;
            
            // Call your actual API endpoint
            console.log(`📞 Calling API for seat map: /api/flights/${flightNumber}/seats`);
            const response = await this.api.request(`/flights/${flightNumber}/seats`);
            console.log('✅ Seat API response:', response);
            
            if (response && response.success) {
                this.seats = response.seatMap || [];
                console.log(`✅ Loaded ${this.seats.length} seats`);
                this.renderSeatMap(response);
            } else {
                throw new Error(response.error || 'Failed to load seat map');
            }
            
        } catch (error) {
            console.error('❌ Failed to load seat map:', error);
            this.showError(`Failed to load seat map: ${error.message}`);
        }
    }

    renderSeatMap(response) {
        console.log('🎨 Rendering seat map...');
        
        const seatMap = response.seatMap || [];
        const flightNumber = response.flightNumber || this.currentFlight;
        const totalSeats = response.totalSeats || 180;
        const availableSeats = response.availableSeats || seatMap.filter(s => s.available).length;
        
        // Create seat map HTML
        const seatMapHTML = `
            <div class="seat-map-container">
                <div class="seat-map-header">
                    <h3><i class="fas fa-chair"></i> Seat Selection - Flight ${flightNumber}</h3>
                    <div class="seat-stats">
                        <span class="stat"><i class="fas fa-chair"></i> Total: ${totalSeats}</span>
                        <span class="stat"><i class="fas fa-check-circle"></i> Available: ${availableSeats}</span>
                        <span class="stat"><i class="fas fa-user-check"></i> Occupied: ${totalSeats - availableSeats}</span>
                    </div>
                </div>
                
                <div class="seat-instruction">
                    <i class="fas fa-info-circle"></i>
                    Please select a seat from the map below to complete check-in.
                </div>
                
                <div class="seat-legend">
                    <div class="legend-item">
                        <div class="seat-sample available"></div> Available
                    </div>
                    <div class="legend-item">
                        <div class="seat-sample selected"></div> Selected
                    </div>
                    <div class="legend-item">
                        <div class="seat-sample occupied"></div> Occupied
                    </div>
                    <div class="legend-item">
                        <div class="seat-sample business"></div> Business Class
                    </div>
                    <div class="legend-item">
                        <div class="seat-sample economy"></div> Economy Class
                    </div>
                </div>
                
                <div class="airplane-cabin">
                    <div class="cockpit">✈️ COCKPIT</div>
                    
                    <div class="cabin-section business-class">
                        <h4><i class="fas fa-crown"></i> Business Class (Rows 1-5)</h4>
                        <div class="seats-grid">
                            ${this.renderSeatRows(1, 5, seatMap)}
                        </div>
                    </div>
                    
                    <div class="cabin-section economy-class">
                        <h4><i class="fas fa-users"></i> Economy Class (Rows 6-30)</h4>
                        <div class="seats-grid">
                            ${this.renderSeatRows(6, 30, seatMap)}
                        </div>
                    </div>
                    
                    <div class="exit">EXIT</div>
                </div>
                
                <div class="seat-selection-panel">
                    <div class="selection-info">
                        <p>Selected Seat: <strong id="selected-seat-display">None</strong></p>
                        <p>Passenger PNR: <code>${this.currentPnr || 'N/A'}</code></p>
                    </div>
                    <div class="selection-actions">
                        <button class="btn btn-secondary" onclick="seatMap.clearSelection()">
                            <i class="fas fa-times"></i> Clear
                        </button>
                        <button class="btn btn-primary" onclick="seatMap.confirmSelection()" id="confirm-seat-btn" disabled>
                            <i class="fas fa-check"></i> Confirm Seat Selection
                        </button>
                    </div>
                </div>
                
                <div class="seat-map-footer">
                    <p><small><i class="fas fa-database"></i> Data Structure: ${response.dataStructure || 'Bitmap'}</small></p>
                </div>
            </div>
        `;
        
        this.seatMapDiv.innerHTML = seatMapHTML;
        
        // Add click handlers
        this.attachSeatHandlers();
    }

    renderSeatRows(startRow, endRow, seatMap) {
        let html = '';
        const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        for (let row = startRow; row <= endRow; row++) {
            html += `<div class="seat-row">`;
            html += `<div class="row-number">${row}</div>`;
            
            for (let i = 0; i < seatLetters.length; i++) {
                const seatLetter = seatLetters[i];
                const seatNumber = `${row}${seatLetter}`;
                
                // Find seat in seatMap
                const seatData = seatMap.find(s => s.seatNumber === seatNumber) || {
                    seatNumber: seatNumber,
                    available: true,
                    passengerName: ''
                };
                
                // Determine seat class
                let seatClass = 'seat';
                if (!seatData.available) {
                    seatClass += ' occupied';
                } else {
                    seatClass += ' available';
                }
                
                // Add class type
                if (row <= 5) {
                    seatClass += ' business-class';
                } else {
                    seatClass += ' economy-class';
                }
                
                // Add tooltip
                const tooltip = seatData.passengerName ? 
                    `Occupied by: ${seatData.passengerName}` : 
                    `Seat ${seatNumber} - Available`;
                
                // Add aisle gap
                if (i === 3) html += '<div class="aisle-gap"></div>';
                
                html += `
                    <div class="${seatClass}" 
                         data-seat="${seatNumber}"
                         data-available="${seatData.available}"
                         title="${tooltip}"
                         onclick="seatMap.handleSeatClick(this)">
                        ${seatNumber}
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        return html;
    }

    attachSeatHandlers() {
        // Handlers are attached via onclick in HTML
        console.log('🔗 Seat handlers attached');
    }

    handleSeatClick(seatElement) {
        const seatNumber = seatElement.dataset.seat;
        const isAvailable = seatElement.dataset.available === 'true';
        
        if (!isAvailable) {
            const passengerName = seatElement.title.replace('Occupied by: ', '');
            alert(`❌ Seat ${seatNumber} is already occupied${passengerName ? ' by ' + passengerName : ''}. Please select another seat.`);
            return;
        }
        
        // Clear previous selection
        if (this.selectedSeat) {
            const prevSeat = document.querySelector(`.seat.selected`);
            if (prevSeat) prevSeat.classList.remove('selected');
        }
        
        // Select new seat
        this.selectedSeat = seatNumber;
        seatElement.classList.add('selected');
        
        // Update display
        const selectedDisplay = document.getElementById('selected-seat-display');
        if (selectedDisplay) selectedDisplay.textContent = seatNumber;
        
        // Enable confirm button
        const confirmBtn = document.getElementById('confirm-seat-btn');
        if (confirmBtn) confirmBtn.disabled = false;
        
        console.log(`✅ Seat selected: ${seatNumber}`);
    }

    clearSelection() {
        this.selectedSeat = null;
        
        // Clear UI selection
        const selectedSeats = document.querySelectorAll('.seat.selected');
        selectedSeats.forEach(seat => {
            seat.classList.remove('selected');
        });
        
        // Update display
        const selectedDisplay = document.getElementById('selected-seat-display');
        if (selectedDisplay) selectedDisplay.textContent = 'None';
        
        // Disable confirm button
        const confirmBtn = document.getElementById('confirm-seat-btn');
        if (confirmBtn) confirmBtn.disabled = true;
    }

    async confirmSelection() {
        if (!this.selectedSeat || !this.currentPnr) {
            alert('Please select a seat and make sure passenger PNR is available.');
            return;
        }
        
        try {
            console.log(`✅ Confirming seat ${this.selectedSeat} for PNR ${this.currentPnr}`);
            
            // Call check-in API
            const result = await this.api.checkIn(this.currentPnr, this.selectedSeat);
            console.log('Check-in result:', result);
            
            if (result.success) {
                alert(`✅ Check-in successful!\n\nPassenger: ${this.currentPnr}\nSeat: ${this.selectedSeat}\n\nBoarding pass has been generated.`);
                
                // Reload seat map to show updated occupancy
                this.loadSeatMap(this.currentFlight, this.currentPnr);
                
                // Update passenger status in parent window
                if (window.passengerManager && window.passengerManager.currentPassenger) {
                    window.passengerManager.currentPassenger.seat = this.selectedSeat;
                    window.passengerManager.currentPassenger.checkedIn = true;
                    window.passengerManager.displayPassengerInfo(window.passengerManager.currentPassenger);
                }
            } else {
                alert(`❌ Check-in failed: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('Check-in error:', error);
            alert(`❌ Check-in failed. Error: ${error.message}\n\nPlease try again or contact support.`);
        }
    }

    showError(message) {
        this.seatMapDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Seat Map Error</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="seatMap.loadDemoSeatMap()">
                    <i class="fas fa-eye"></i> Show Demo Seat Map
                </button>
            </div>
        `;
    }

    loadDemoSeatMap() {
        console.log('🔄 Loading demo seat map');
        
        // Create demo seat data
        const demoData = {
            success: true,
            flightNumber: this.currentFlight || 'DEMO123',
            totalSeats: 180,
            availableSeats: 120,
            seatMap: []
        };
        
        // Generate demo seats
        for (let row = 1; row <= 30; row++) {
            for (let col of ['A', 'B', 'C', 'D', 'E', 'F']) {
                demoData.seatMap.push({
                    seatNumber: `${row}${col}`,
                    row: row,
                    column: col,
                    available: Math.random() > 0.3, // 70% available
                    passengerName: Math.random() > 0.8 ? 'Demo Passenger' : ''
                });
            }
        }
        
        this.seats = demoData.seatMap;
        this.renderSeatMap(demoData);
    }
}

// Create global instance
console.log("🔧 Creating SeatMapUI instance...");
const seatMap = new SeatMapUI();
window.seatMap = seatMap;
console.log("✅ SeatMapUI created:", seatMap);