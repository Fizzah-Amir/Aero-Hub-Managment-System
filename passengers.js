// passengers.js - Fixed version
console.log('🚀 passengers.js LOADED!');
console.log('FlightAPI available:', !!window.FlightAPI);

// Add a simple test
if (!window.FlightAPI) {
    console.error('❌ ERROR: FlightAPI not found! Check if api.js loaded correctly');
    alert('Error: FlightAPI not loaded. Check browser console.');
}
class PassengerManager {
    constructor() {
        this.api = window.FlightAPI;
        this.currentPassenger = null;
        this.currentFlight = null;
        this.selectedSeat = null;
        this.seatMap = null;
        
        this.initialize();
    }

    initialize() {
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for PNR in URL or auto-search
        this.checkAutoSearch();
    }

    setupEventListeners() {
        document.getElementById('search-btn')?.addEventListener('click', () => {
            const pnr = document.getElementById('pnr-search').value.trim();
            if (pnr) {
                this.searchByPNR(pnr);
            } else {
                this.showMessage('error', 'Please enter a PNR number');
            }
        });

        document.getElementById('pnr-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const pnr = e.target.value.trim();
                if (pnr) {
                    this.searchByPNR(pnr);
                }
            }
        });
    }

    checkAutoSearch() {
        // Check if there's a PNR in the URL or input field
        const pnrInput = document.getElementById('pnr-search');
        if (pnrInput && pnrInput.value) {
            setTimeout(() => {
                this.searchByPNR(pnrInput.value);
            }, 500);
        }
    }

    async searchByPNR(pnr) {
        const pnrInput = document.getElementById('pnr-search');
        const resultEl = document.getElementById('search-result');
        const seatMapEl = document.getElementById('seat-map');
        
        // Clear previous results
        this.currentPassenger = null;
        this.selectedSeat = null;
        seatMapEl.innerHTML = '';
        
        // Show loading
        resultEl.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <div>Searching for passenger ${pnr}...</div>
            </div>
        `;

        try {
            console.log(`🔍 Searching for PNR: ${pnr}`);
            
            // Call the API
            const response = await this.api.getPassenger(pnr);
            console.log('API Response:', response);
            
            if (response && response.success) {
                this.currentPassenger = response.passenger;
                this.renderPassengerDetails(this.currentPassenger);
                
                // Load seat map if flight exists
                if (this.currentPassenger.flightId) {
                    await this.loadSeatMap(this.currentPassenger.flightId);
                } else {
                    seatMapEl.innerHTML = `
                        <div class="message warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>No flight assigned to this passenger</div>
                        </div>
                    `;
                }
            } else {
                throw new Error(response.error || 'Passenger not found');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            resultEl.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Passenger not found</strong><br>
                        <small>Error: ${error.message}</small>
                    </div>
                </div>
            `;
        }
    }

    renderPassengerDetails(apiResponse) {
    const resultEl = document.getElementById('search-result');
    
    // 🔴 CRITICAL FIX: Extract passenger from response
    const passenger = apiResponse.passenger || apiResponse;
    
    // Now extract with correct property names
    const passengerName = passenger.name || passenger.passengerName || 'N/A';
    const flightNumber = passenger.flightId || passenger.flightNumber || 'N/A';
    const seatNumber = passenger.seat || passenger.seatNumber || 'Not assigned';
    const classType = passenger.classType || passenger.class || 'N/A';
    const isCheckedIn = passenger.checkedIn || false;
    const email = passenger.email || 'N/A';
    const pnr = passenger.pnr || 'N/A';
    
    console.log('✅ Passenger data extracted:', {
        name: passengerName,
        flight: flightNumber,
        seat: seatNumber,
        class: classType
    });
        resultEl.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>✅ Passenger Found</h3>
                <span class="status ${isCheckedIn ? 'on-time' : 'delayed'}">
                    ${isCheckedIn ? 'CHECKED-IN' : 'NOT CHECKED-IN'}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
                <div>
                    <strong><i class="fas fa-user"></i> Name:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${passengerName}</div>
                </div>
                <div>
                    <strong><i class="fas fa-ticket-alt"></i> PNR:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${pnr}</div>
                </div>
                <div>
                    <strong><i class="fas fa-plane"></i> Flight:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${flightNumber}</div>
                </div>
                <div>
                    <strong><i class="fas fa-chair"></i> Seat:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${seatNumber}</div>
                </div>
                <div>
                    <strong><i class="fas fa-star"></i> Class:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${classType}</div>
                </div>
                <div>
                    <strong><i class="fas fa-envelope"></i> Email:</strong><br>
                    <div style="margin-top: 5px; font-size: 18px; color: #1f2937;">${email}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                ${!isCheckedIn ? `
                    <button class="btn btn-success" onclick="window.passengerManager.showCheckinForm()">
                        <i class="fas fa-check-circle"></i> Check-in Now
                    </button>
                ` : ''}
                <button class="btn" onclick="window.passengerManager.printBoardingPass()">
                    <i class="fas fa-print"></i> Print Boarding Pass
                </button>
                ${seatNumber !== 'Not assigned' ? `
                    <button class="btn btn-warning" onclick="window.passengerManager.changeSeat()">
                        <i class="fas fa-exchange-alt"></i> Change Seat
                    </button>
                ` : ''}
                <button class="btn btn-secondary" onclick="window.passengerManager.createNewBooking()">
                    <i class="fas fa-plus"></i> New Booking
                </button>
            </div>
        </div>
    `;
}

    async loadSeatMap(flightNumber) {
        const seatMapEl = document.getElementById('seat-map');
        
        try {
            console.log(`🛫 Loading seat map for flight: ${flightNumber}`);
            seatMapEl.innerHTML = `
                <div class="loader">
                    <div class="spinner"></div>
                    <div>Loading seat map for flight ${flightNumber}...</div>
                </div>
            `;

            // Call the seat map API
            const response = await this.api.getSeatMap(flightNumber);
            console.log('Seat map response:', response);
            
            if (response && response.success) {
                this.seatMap = response.seatMap || response;
                this.renderSeatMap(this.seatMap);
            } else {
                throw new Error('Failed to load seat map');
            }
            
        } catch (error) {
            console.error('Seat map error:', error);
            seatMapEl.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Failed to load seat map</strong><br>
                        <small>Error: ${error.message}</small>
                    </div>
                </div>
            `;
        }
    }

    renderSeatMap(seatMap) {
        const seatMapEl = document.getElementById('seat-map');
        
        // Extract seat map data
        const flightNumber = seatMap.flightNumber || this.currentPassenger?.flightId || 'Unknown';
        const totalSeats = seatMap.totalSeats || 180;
        const availableSeats = seatMap.availableSeats || seatMap.seats?.filter(s => s.available).length || 0;
        const occupiedSeats = totalSeats - availableSeats;
        const seats = seatMap.seats || seatMap.seatMap || [];
        
        console.log(`Seat map data: ${totalSeats} total, ${availableSeats} available, ${occupiedSeats} occupied`);

        // Create seat grid (30 rows, 6 seats per row)
        let seatGridHTML = '';
        
        for (let row = 1; row <= 30; row++) {
            // Row number
            seatGridHTML += `<div class="seat-row-label">${row}</div>`;
            
            // Columns A-F with aisle between C and D
            for (let col = 0; col < 6; col++) {
                const seatLetter = String.fromCharCode(65 + col);
                const seatNumber = `${row}${seatLetter}`;
                
                // Check if seat exists in seat map
                const seat = seats.find(s => s.seatNumber === seatNumber);
                const isAvailable = seat ? seat.available : false;
                const isCurrentPassengerSeat = this.currentPassenger && 
                    (this.currentPassenger.seat === seatNumber || 
                     this.currentPassenger.seatNumber === seatNumber);
                
                // Determine seat status
                let seatClass = 'seat';
                let title = `${seatNumber} - Available`;
                
                if (!isAvailable) {
                    seatClass += ' occupied';
                    title = `${seatNumber} - Occupied`;
                }
                
                if (isCurrentPassengerSeat) {
                    seatClass += ' current-passenger';
                    title = `${seatNumber} - Your seat`;
                }
                
                if (this.selectedSeat === seatNumber) {
                    seatClass += ' selected';
                }
                
                seatGridHTML += `
                    <div class="${seatClass}" 
                         onclick="window.passengerManager.selectSeat('${seatNumber}', ${isAvailable})"
                         title="${title}">
                        ${seatLetter}
                    </div>
                `;
                
                // Add aisle after column C (index 2)
                if (col === 2) {
                    seatGridHTML += `<div class="aisle"></div>`;
                }
            }
        }

        seatMapEl.innerHTML = `
            <div class="card">
                <h3><i class="fas fa-chair"></i> Seat Map - Flight ${flightNumber}</h3>
                
                <div style="margin: 20px 0; display: flex; gap: 20px; flex-wrap: wrap;">
                    <div class="seat-legend">
                        <div class="seat-legend-item">
                            <div class="seat available"></div>
                            <span>Available (${availableSeats})</span>
                        </div>
                        <div class="seat-legend-item">
                            <div class="seat occupied"></div>
                            <span>Occupied (${occupiedSeats})</span>
                        </div>
                        <div class="seat-legend-item">
                            <div class="seat current-passenger"></div>
                            <span>Your seat</span>
                        </div>
                    </div>
                </div>
                
                <div class="aircraft-layout">
                    <div class="cockpit">
                        <i class="fas fa-plane" style="font-size: 24px;"></i>
                    </div>
                    
                    <div class="seat-map-grid">
                        ${seatGridHTML}
                    </div>
                    
                    <div class="exit-row">EXIT</div>
                </div>
                
                <div style="margin-top: 25px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn" onclick="window.passengerManager.autoAssignSeat()" 
                            ${availableSeats === 0 ? 'disabled' : ''}>
                        <i class="fas fa-magic"></i> Auto-Assign Seat
                    </button>
                    <button class="btn btn-success" onclick="window.passengerManager.confirmCheckin()" 
                            id="confirm-checkin-btn" disabled>
                        <i class="fas fa-check"></i> Confirm Check-in
                    </button>
                    <button class="btn btn-secondary" onclick="window.passengerManager.clearSelection()">
                        <i class="fas fa-times"></i> Clear Selection
                    </button>
                </div>
            </div>
        `;
    }

    selectSeat(seatNumber, isAvailable) {
        if (!isAvailable) {
            this.showMessage('error', `Seat ${seatNumber} is already occupied`);
            return;
        }
        
        this.selectedSeat = seatNumber;
        
        // Update UI
        document.querySelectorAll('.seat').forEach(seat => {
            seat.classList.remove('selected');
        });
        
        const seatEl = document.querySelector(`[onclick*="${seatNumber}"]`);
        if (seatEl) {
            seatEl.classList.add('selected');
        }
        
        // Enable confirm button
        const confirmBtn = document.getElementById('confirm-checkin-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
        
        this.showMessage('info', `Selected seat: ${seatNumber}`);
    }

    clearSelection() {
        this.selectedSeat = null;
        document.querySelectorAll('.seat').forEach(seat => {
            seat.classList.remove('selected');
        });
        
        const confirmBtn = document.getElementById('confirm-checkin-btn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
        
        this.showMessage('info', 'Selection cleared');
    }

    autoAssignSeat() {
        if (!this.seatMap) return;
        
        // Find first available seat
        const seats = this.seatMap.seats || this.seatMap.seatMap || [];
        for (const seat of seats) {
            if (seat.available) {
                this.selectSeat(seat.seatNumber, true);
                this.showMessage('success', `Auto-assigned seat: ${seat.seatNumber}`);
                return;
            }
        }
        
        this.showMessage('warning', 'No available seats found');
    }

    async confirmCheckin() {
        if (!this.selectedSeat || !this.currentPassenger) {
            this.showMessage('error', 'Please select a seat first');
            return;
        }

        try {
            console.log(`✅ Checking in ${this.currentPassenger.pnr} with seat ${this.selectedSeat}`);
            
            // Call check-in API
            await this.api.checkIn(this.currentPassenger.pnr, this.selectedSeat);
            
            this.showMessage('success', `Check-in successful! Seat ${this.selectedSeat} assigned.`);
            
            // Refresh passenger details
            await this.searchByPNR(this.currentPassenger.pnr);
            
            // Clear selection
            this.selectedSeat = null;
            
        } catch (error) {
            console.error('Check-in error:', error);
            this.showMessage('error', `Check-in failed: ${error.message}`);
        }
    }

    showCheckinForm() {
        if (!this.currentPassenger) {
            this.showMessage('error', 'No passenger selected');
            return;
        }
        
        if (!this.currentPassenger.flightId) {
            this.showMessage('error', 'No flight assigned to this passenger');
            return;
        }
        
        // Reload seat map if not already loaded
        if (!this.seatMap) {
            this.loadSeatMap(this.currentPassenger.flightId);
        }
        
        this.showMessage('info', 'Please select a seat from the map below');
    }

    changeSeat() {
        if (!this.currentPassenger) {
            this.showMessage('error', 'No passenger selected');
            return;
        }
        
        if (!this.currentPassenger.checkedIn) {
            this.showMessage('error', 'Passenger is not checked in yet');
            return;
        }
        
        this.showCheckinForm();
        this.showMessage('info', 'Please select a new seat');
    }

    printBoardingPass() {
        if (!this.currentPassenger) {
            this.showMessage('error', 'No passenger selected');
            return;
        }
        
        const passenger = this.currentPassenger;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Boarding Pass - ${passenger.pnr}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .boarding-pass { 
                        background: white;
                        border-radius: 15px;
                        padding: 30px;
                        max-width: 500px;
                        width: 100%;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .header { 
                        text-align: center; 
                        font-size: 28px; 
                        margin-bottom: 30px;
                        color: #1f2937;
                    }
                    .passenger-info {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 25px 0;
                    }
                    .info-item {
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                    }
                    .info-label {
                        font-size: 12px;
                        color: #6b7280;
                        margin-bottom: 5px;
                    }
                    .info-value {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1f2937;
                    }
                    .barcode {
                        text-align: center;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f8fafc;
                        border-radius: 10px;
                    }
                    .barcode-code {
                        font-family: monospace;
                        font-size: 32px;
                        letter-spacing: 3px;
                        color: #1f2937;
                    }
                    .footer {
                        text-align: center;
                        color: #6b7280;
                        font-size: 12px;
                        margin-top: 20px;
                    }
                    @media print { 
                        @page { margin: 0; } 
                        body { 
                            background: white;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="boarding-pass">
                    <div class="header">
                        <i class="fas fa-plane" style="color: #2563eb; margin-right: 10px;"></i>
                        BOARDING PASS
                    </div>
                    
                    <div class="passenger-info">
                        <div class="info-item">
                            <div class="info-label">PASSENGER</div>
                            <div class="info-value">${passenger.name || passenger.passengerName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">PNR</div>
                            <div class="info-value">${passenger.pnr}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">FLIGHT</div>
                            <div class="info-value">${passenger.flightId || passenger.flightNumber}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">SEAT</div>
                            <div class="info-value">${passenger.seat || passenger.seatNumber || 'TBA'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">CLASS</div>
                            <div class="info-value">${passenger.classType || passenger.class}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">STATUS</div>
                            <div class="info-value">${passenger.checkedIn ? 'CHECKED-IN' : 'NOT CHECKED-IN'}</div>
                        </div>
                    </div>
                    
                    <div class="barcode">
                        <div class="barcode-code">${passenger.pnr}</div>
                        <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                            <i class="fas fa-qrcode"></i> Scan at gate
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Please arrive at the gate at least 45 minutes before departure</p>
                        <p>For assistance: support@airport-system.com</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { 
                            window.close(); 
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    showMessage(type, text) {
        // Simple message display - you can enhance this
        alert(`${type.toUpperCase()}: ${text}`);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Passenger Manager...');
    window.passengerManager = new PassengerManager();
});
function initPassengerManager() {
    console.log('🚀 Initializing Passenger Manager...');
    window.passengerManager = new PassengerManager();
    
    // Auto-test with PNR7179
    setTimeout(() => {
        const pnrInput = document.getElementById('pnr-search');
        if (pnrInput && (!pnrInput.value || pnrInput.value === '')) {
            pnrInput.value = 'PNR7179';
            window.passengerManager.searchByPNR('PNR7179');
        }
    }, 1000);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPassengerManager);
} else {
    // DOM already loaded
    initPassengerManager();
}