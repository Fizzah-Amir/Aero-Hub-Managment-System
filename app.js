 class AirportSystem {
    constructor() {
        this.api = window.FlightAPI;
        this.currentPage = 'dashboard';
        this.initializeApp();
    }
  
    initializeApp() {
        // Set up navigation
        this.setupNavigation();
        
        // Check server connection first
        this.checkServerConnection();
        
        // Set up auto-refresh for flights
        this.setupAutoRefresh();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    async checkServerConnection() {
        try {
            const contentEl = document.getElementById('content');
            contentEl.innerHTML = '<div class="loader"><div class="spinner"></div>Connecting to server...</div>';
            
            const health = await this.api.checkHealth();
            console.log('✅ Server connected:', health);
            
            // Load dashboard
            this.loadDashboard();
            
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            
            const contentEl = document.getElementById('content');
            contentEl.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Cannot connect to server</strong><br>
                        <small>${error.message}</small><br>
                        <small style="margin-top: 10px; display: block;">
                            Steps to fix:
                            <ol style="margin-left: 20px; margin-top: 5px;">
                                <li>Start your C++ server: <code>cd server && ./run_server.sh</code></li>
                                <li>Make sure it's running on port 8080</li>
                                <li>Check if the server is accessible: <code>curl http://localhost:8080/api/health</code></li>
                                <li>Refresh this page after starting the server</li>
                            </ol>
                        </small>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="app.checkServerConnection()">
                        <i class="fas fa-sync-alt"></i> Retry Connection
                    </button>
                </div>
            `;
        }
    }

    async navigateTo(page) {
        this.currentPage = page;
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Update content area
        const contentEl = document.getElementById('content');
        contentEl.innerHTML = '<div class="loader"><div class="spinner"></div>Loading...</div>';
        
        try {
            switch(page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'flights':
                    await this.loadFlightsPage();
                    break;
                case 'passengers':
                    await this.loadPassengersPage();
                    break;
                case 'gates':
                    await this.loadGatesPage();
                    break;
                case 'routes':
                    await this.loadRoutesPage();
                    break;
                case 'stats':
                    await this.loadStatsPage();
                    break;
            }
        } catch (error) {
            this.showMessage('error', `Failed to load ${page}: ${error.message}`);
        }
    }

    async loadDashboard() {
        const contentEl = document.getElementById('content');
        
        try {
            console.log('📊 Loading dashboard data...');
            
            // Show loading state
            contentEl.innerHTML = '<div class="loader"><div class="spinner"></div>Loading dashboard...</div>';
            
            // Get flights and stats in parallel
            const [flightsData, statsData] = await Promise.all([
                this.api.getAllFlights().catch(err => {
                    console.error('❌ Failed to load flights:', err);
                    return { success: false, flights: [], count: 0 };
                }),
                this.api.getStats().catch(err => {
                    console.error('❌ Failed to load stats:', err);
                    return { success: false, stats: {} };
                })
            ]);
            
            console.log('📈 Flights data:', flightsData);
            console.log('📊 Stats data:', statsData);
            
            // Extract data with fallbacks
            const flights = flightsData.success ? flightsData.flights || [] : [];
            const stats = statsData.success ? statsData.stats || {} : {};
            
            console.log(`✅ Loaded ${flights.length} flights`);
            
            // If no flights, show helpful message
            if (flights.length === 0) {
                const html = `
                    <div class="dashboard">
                        <div class="section-header">
                            <h2><i class="fas fa-tachometer-alt"></i> Dashboard Overview</h2>
                            <div class="btn-group">
                                <button class="btn" onclick="app.refreshDashboard()">
                                    <i class="fas fa-sync-alt"></i> Refresh
                                </button>
                            </div>
                        </div>
                        
                        <div class="message warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <strong>No flights found in system.</strong><br>
                                <small>Try adding flights from the Flight Board or check if the server is properly initialized.</small>
                            </div>
                        </div>
                        
                        <div class="dashboard-grid">
                            <div class="stat-card">
                                <h3><i class="fas fa-plane"></i> Total Flights</h3>
                                <div class="number">0</div>
                                <div class="label">Active in system</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-users"></i> Total Passengers</h3>
                                <div class="number">${stats.totalPassengers || 0}</div>
                                <div class="label">Booked / Checked-in</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-door-open"></i> Available Gates</h3>
                                <div class="number">5</div>
                                <div class="label">Ready for boarding</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-chair"></i> Available Seats</h3>
                                <div class="number">${stats.availableSeats || 0}</div>
                                <div class="label">Across all flights</div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                                <button class="btn" onclick="app.navigateTo('passengers')">
                                    <i class="fas fa-user-check"></i> Passenger Check-in
                                </button>
                                <button class="btn btn-secondary" onclick="app.navigateTo('flights')">
                                    <i class="fas fa-plane-departure"></i> Manage Flights
                                </button>
                                <button class="btn btn-warning" onclick="app.navigateTo('gates')">
                                    <i class="fas fa-door-closed"></i> Gate Control
                                </button>
                                <button class="btn btn-success" onclick="app.navigateTo('routes')">
                                    <i class="fas fa-route"></i> Find Routes
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                contentEl.innerHTML = html;
                return;
            }
            
            // Normal dashboard with flights
            const html = `
                <div class="dashboard">
                    <div class="section-header">
                        <h2><i class="fas fa-tachometer-alt"></i> Dashboard Overview</h2>
                        <div class="btn-group">
                            <button class="btn" onclick="app.refreshDashboard()">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                    
                    <div class="dashboard-grid">
                        <div class="stat-card">
                            <h3><i class="fas fa-plane"></i> Total Flights</h3>
                            <div class="number">${stats.totalFlights || flights.length}</div>
                            <div class="label">Active in system</div>
                        </div>
                        
                        <div class="stat-card">
                            <h3><i class="fas fa-users"></i> Total Passengers</h3>
                            <div class="number">${stats.totalPassengers || '0'}</div>
                            <div class="label">Booked / Checked-in</div>
                        </div>
                        
                        <div class="stat-card">
                            <h3><i class="fas fa-door-open"></i> Available Gates</h3>
                            <div class="number">${Math.floor(Math.random() * 8) + 3}</div>
                            <div class="label">Ready for boarding</div>
                        </div>
                        
                        <div class="stat-card">
                            <h3><i class="fas fa-chair"></i> Available Seats</h3>
                            <div class="number">${stats.availableSeats || '0'}</div>
                            <div class="label">Across all flights</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3><i class="fas fa-clock"></i> Recent Flight Updates</h3>
                        <div class="table-container" style="margin-top: 20px;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Flight</th>
                                        <th>Route</th>
                                        <th>Departure</th>
                                        <th>Gate</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${flights.slice(0, 5).map(flight => `
                                        <tr>
                                            <td><strong>${flight.flightNumber}</strong><br><small style="color: #6b7280;">${flight.airline}</small></td>
                                            <td>${flight.origin} → ${flight.destination}</td>
                                            <td>${flight.departureTime}</td>
                                            <td>${flight.gate}</td>
                                            <td>
                                                <span class="status on-time">ON TIME</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn" onclick="app.navigateTo('flights')">
                                <i class="fas fa-list"></i> View All Flights
                            </button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
                            <button class="btn" onclick="app.navigateTo('passengers')">
                                <i class="fas fa-user-check"></i> Passenger Check-in
                            </button>
                            <button class="btn btn-secondary" onclick="app.navigateTo('flights')">
                                <i class="fas fa-plane-departure"></i> Manage Flights
                            </button>
                            <button class="btn btn-warning" onclick="app.navigateTo('gates')">
                                <i class="fas fa-door-closed"></i> Gate Control
                            </button>
                            <button class="btn btn-success" onclick="app.navigateTo('routes')">
                                <i class="fas fa-route"></i> Find Routes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            contentEl.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Dashboard loading error:', error);
            
            contentEl.innerHTML = `
                <div class="message error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Failed to load dashboard</strong><br>
                        <small>${error.message}</small><br>
                        <small style="margin-top: 10px; display: block;">
                            Make sure:
                            <ol style="margin-left: 20px; margin-top: 5px;">
                                <li>Your C++ server is running on port 8080</li>
                                <li>Check browser console for more details (F12 → Console)</li>
                                <li>Try refreshing the page</li>
                            </ol>
                        </small>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="app.loadDashboard()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    async loadFlightsPage() {
        const contentEl = document.getElementById('content');
        contentEl.innerHTML = `
            <div class="flights-page">
                <div class="section-header">
                    <h2><i class="fas fa-plane-departure"></i> Flight Board (Sorted by Time)</h2>
                    <div class="btn-group">
                        <button class="btn" onclick="app.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                        <button class="btn btn-success" onclick="flightsManager.showAddFlightForm()">
                            <i class="fas fa-plus"></i> Add Flight
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3><i class="fas fa-filter"></i> Filter Flights by Time Range</h3>
                        <div id="query-info" style="color: #6b7280; font-size: 14px;">
                            Showing flights between 14:00 and 17:00
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <div style="flex: 1;">
                            <label>Start Time</label>
                            <select id="start-time" style="width: 100%;">
                                <option value="06:00">06:00 AM</option>
                                <option value="08:00">08:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="14:00" selected>02:00 PM</option>
                                <option value="16:00">04:00 PM</option>
                                <option value="18:00">06:00 PM</option>
                                <option value="20:00">08:00 PM</option>
                            </select>
                        </div>
                        
                        <div style="flex: 1;">
                            <label>End Time</label>
                            <select id="end-time" style="width: 100%;">
                                <option value="10:00">10:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="14:00">02:00 PM</option>
                                <option value="16:00">04:00 PM</option>
                                <option value="17:00" selected>05:00 PM</option>
                                <option value="18:00">06:00 PM</option>
                                <option value="20:00">08:00 PM</option>
                                <option value="22:00">10:00 PM</option>
                            </select>
                        </div>
                        
                        <div style="align-self: flex-end;">
                            <button class="btn" onclick="flightsManager.loadFlightsByTimeRange()">
                                <i class="fas fa-search"></i> Search
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3><i class="fas fa-list"></i> Flight Schedule</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Flight</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Departure</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="flights-table">
                                <!-- Flights will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="loader" id="flights-loader">
                        <div class="spinner"></div>
                        Loading flights...
                    </div>
                </div>
                
                <div id="add-flight-form-container" style="display: none;">
                    <!-- Add flight form will be inserted here -->
                </div>
            </div>
        `;
        
        // Initialize flights manager and load flights
        if (!window.flightsManager) {
            window.flightsManager = {
                api: this.api,
                currentTimeRange: { start: '14:00', end: '17:00' },
                
                async loadFlightsByTimeRange() {
                    const loader = document.getElementById('flights-loader');
                    const table = document.getElementById('flights-table');
                    
                    loader.classList.add('active');
                    table.innerHTML = '';
                    
                    // Update current time range from UI
                    this.currentTimeRange.start = document.getElementById('start-time').value;
                    this.currentTimeRange.end = document.getElementById('end-time').value;
                    
                    try {
                        const response = await this.api.getFlightsByTimeRange(
                            this.currentTimeRange.start,
                            this.currentTimeRange.end
                        );
                        
                        this.renderFlights(response.flights || []);
                        
                        // Show query info
                        document.getElementById('query-info').innerHTML = `
                            ✅ Showing ${response.count || 0} flights (Time Range: ${this.currentTimeRange.start} to ${this.currentTimeRange.end})
                        `;
                    } catch (error) {
                        table.innerHTML = `
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px; color: #ef4444;">
                                    <i class="fas fa-exclamation-circle"></i><br>
                                    Failed to load flights: ${error.message}
                                </td>
                            </tr>
                        `;
                    } finally {
                        loader.classList.remove('active');
                    }
                },
                
                renderFlights(flights) {
                    const tbody = document.getElementById('flights-table');
                    
                    if (!flights || flights.length === 0) {
                        tbody.innerHTML = `
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px;">
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
                                <small style="color: #6b7280;">${flight.airline}</small>
                            </td>
                            <td>${flight.origin}</td>
                            <td>${flight.destination}</td>
                            <td>
                                <div style="font-weight: 600;">${flight.departureTime}</div>
                                <small style="color: #6b7280;">Gate ${flight.gate}</small>
                            </td>
                            <td>
                                <span class="status on-time">ON TIME</span>
                            </td>
                            <td>
                                <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="flightsManager.viewFlight('${flight.flightNumber}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="flightsManager.cancelFlight('${flight.flightNumber}')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </td>
                        </tr>
                    `).join('');
                },
                
                async viewFlight(flightNumber) {
                    try {
                        const response = await this.api.getFlight(flightNumber);
                        this.showFlightDetails(response.flight);
                    } catch (error) {
                        this.showMessage('error', 'Flight not found: ' + error.message);
                    }
                },
                
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
                                    <div><strong>Airline:</strong> ${flight.airline}</div>
                                    <div><strong>Route:</strong> ${flight.origin} → ${flight.destination}</div>
                                    <div><strong>Departure:</strong> ${flight.departureTime}</div>
                                    <div><strong>Arrival:</strong> ${flight.arrivalTime || 'N/A'}</div>
                                    <div><strong>Gate:</strong> ${flight.gate}</div>
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
                },
                
                async cancelFlight(flightNumber) {
                    if (!confirm(`Are you sure you want to cancel flight ${flightNumber}?`)) return;
                    
                    try {
                        await this.api.deleteFlight(flightNumber);
                        app.showMessage('success', `Flight ${flightNumber} cancelled successfully`);
                        await this.loadFlightsByTimeRange();
                    } catch (error) {
                        app.showMessage('error', 'Failed to cancel flight: ' + error.message);
                    }
                },
                
                async loadSeatMap(flightNumber) {
                    try {
                        const seatMap = await this.api.getSeatMap(flightNumber);
                        this.showSeatMapModal(seatMap);
                    } catch (error) {
                        app.showMessage('error', 'Failed to load seat map: ' + error.message);
                    }
                },
                
                showSeatMapModal(seatMap) {
                    const modalHtml = `
                        <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                            <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 800px; width: 95%;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                    <h3>Seat Map - Flight ${seatMap.flightNumber}</h3>
                                    <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <div>Available: ${seatMap.availableSeats}/${seatMap.totalSeats} seats</div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; max-height: 400px; overflow-y: auto;">
                                    ${seatMap.seatMap.map(seat => `
                                        <div style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 5px; text-align: center;
                                             background: ${seat.available ? '#dcfce7' : '#fee2e2'};">
                                            ${seat.seatNumber}<br>
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
                },
                
                showAddFlightForm() {
                    const container = document.getElementById('add-flight-form-container');
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
                },
                
                async addNewFlight() {
                    const flightNumber = document.getElementById('add-flight-number').value;
                    const airline = document.getElementById('add-airline').value;
                    const origin = document.getElementById('add-origin').value;
                    const destination = document.getElementById('add-destination').value;
                    const departureTime = document.getElementById('add-departure').value;
                    const arrivalTime = document.getElementById('add-arrival').value;
                    
                    if (!flightNumber || !airline || !origin || !destination || !departureTime) {
                        app.showMessage('error', 'Please fill all required fields (*)');
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
                        app.showMessage('success', 'Flight added successfully!');
                        document.getElementById('add-flight-form-container').style.display = 'none';
                        await this.loadFlightsByTimeRange();
                    } catch (error) {
                        app.showMessage('error', 'Failed to add flight: ' + error.message);
                    }
                },
                
                showMessage(type, text) {
                    app.showMessage(type, text);
                }
            };
        }
        
        // Load flights immediately
        setTimeout(() => {
            window.flightsManager.loadFlightsByTimeRange();
        }, 100);
    }

    async loadPassengersPage() {
        const contentEl = document.getElementById('content');
        contentEl.innerHTML = `
            <div class="passengers-page">
                <div class="section-header">
                    <h2><i class="fas fa-user-check"></i> Passenger Check-in System</h2>
                    <div class="btn-group">
                        <button class="btn" onclick="app.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                        <button class="btn btn-secondary" onclick="passengerManager.createNewBooking()">
                            <i class="fas fa-plus"></i> New Booking
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <h3><i class="fas fa-search"></i> Find Passenger by PNR</h3>
                    <div class="input-group">
                        <div style="flex: 1;">
                            <input type="text" id="pnr-search" placeholder="Enter PNR (e.g., PNR1001)" 
                                   style="width: 100%;" value="PNR1001">
                        </div>
                        <button class="btn" id="search-btn">
                            <i class="fas fa-search"></i> Search
                        </button>
                        <button class="btn btn-secondary" onclick="passengerManager.scanQR()">
                            <i class="fas fa-qrcode"></i> Scan QR
                        </button>
                    </div>
                </div>
                
                <div id="search-result">
                    <!-- Search results will appear here -->
                    <div class="message info">
                        <i class="fas fa-info-circle"></i>
                        <div>Enter a PNR number to search for passenger details</div>
                    </div>
                </div>
                
                <div id="seat-map" style="margin-top: 30px;">
                    <!-- Seat map will be loaded here -->
                </div>
            </div>
        `;
        
        // Initialize passenger manager
        if (!window.passengerManager) {
            window.passengerManager = {
                api: this.api,
                currentPassenger: null,
                currentSeatMap: null,
                selectedSeat: null,
                
               async searchPassenger() {
    const pnrInput = document.getElementById('pnr-search');
    const pnr = pnrInput.value.trim().toUpperCase();
    
    if (!pnr) {
        app.showMessage('error', 'Please enter a PNR number');
        return;
    }

    const resultEl = document.getElementById('search-result');
    resultEl.innerHTML = '<div class="loader"><div class="spinner"></div>Searching passenger...</div>';

    try {
        const response = await this.api.getPassenger(pnr);  // ✅ Now we get full response
        console.log('🔍 API Response:', response);
        
        // Store the passenger data from the response
        this.currentPassenger = response.passenger || response;
        
        // Pass the full response to render function
        this.renderPassengerDetails(response);
        
        // Load seat map if flight number exists
        if (this.currentPassenger.flightId) {
            await this.loadSeatMap(this.currentPassenger.flightId);
        }
    } catch (error) {
        resultEl.innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-circle"></i>
                <div>Passenger not found. Please check the PNR number.</div>
            </div>
        `;
    }
},
                renderPassengerDetails(apiResponse) {
    const resultEl = document.getElementById('search-result');
    
    // 🔴 CRITICAL FIX: Extract passenger from nested object
    const passenger = apiResponse.passenger || apiResponse;
    
    // 🔴 CRITICAL FIX: Use correct property names
    const passengerName = passenger.name || passenger.passengerName || 'N/A';
    const pnr = passenger.pnr || 'N/A';
    const flightNumber = passenger.flightId || passenger.flightNumber || 'N/A';
    const seatNumber = passenger.seat || passenger.seatNumber || 'Not assigned';
    const classType = passenger.classType || passenger.class || 'N/A';
    const isCheckedIn = passenger.checkedIn || false;
    
    console.log('✅ Extracted passenger:', { 
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
            
            <div style="display: grid; gap: 15px; margin-bottom: 25px;">
                <div>
                    <strong>Name:</strong><br>
                    ${passengerName}
                </div>
                <div>
                    <strong>PNR:</strong><br>
                    ${pnr}
                </div>
                <div>
                    <strong>Flight:</strong><br>
                    ${flightNumber}
                </div>
                <div>
                    <strong>Seat:</strong><br>
                    ${seatNumber}
                </div>
                <div>
                    <strong>Class:</strong><br>
                    ${classType}
                </div>
            </div>
            ...
        </div>
    `;
},
               
                async loadSeatMap(flightNumber) {
                    try {
                        const seatMap = await this.api.getSeatMap(flightNumber);
                        this.currentSeatMap = seatMap;
                        this.renderSeatMap(seatMap);
                    } catch (error) {
                        console.error('Failed to load seat map:', error);
                        document.getElementById('seat-map').innerHTML = `
                            <div class="message error">
                                <i class="fas fa-exclamation-circle"></i>
                                <div>Failed to load seat map: ${error.message}</div>
                            </div>
                        `;
                    }
                },
                
                renderSeatMap(seatMap) {
                    const seatMapEl = document.getElementById('seat-map');
                    
                    // Create a simple seat grid (6 seats per row, 30 rows)
                    let html = `
                        <div class="card">
                            <h3>Seat Map for Flight ${seatMap.flightNumber}</h3>
                            <div style="margin: 20px 0; display: flex; gap: 20px;">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <div style="width: 20px; height: 20px; background: #dcfce7; border: 1px solid #16a34a;"></div>
                                    <span>Available (${seatMap.availableSeats})</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <div style="width: 20px; height: 20px; background: #fee2e2; border: 1px solid #dc2626;"></div>
                                    <span>Occupied (${seatMap.occupiedSeats})</span>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(13, 1fr); gap: 5px; max-height: 500px; overflow-y: auto; padding: 10px; background: #f8fafc; border-radius: 10px;">
                    `;
                    
                    // Header for columns
                    html += `<div></div>`; // Empty cell for row numbers
                    for (let col = 0; col < 6; col++) {
                        html += `<div style="text-align: center; font-weight: bold; padding: 5px;">${String.fromCharCode(65 + col)}</div>`;
                        if (col === 2) {
                            html += `<div style="text-align: center; font-weight: bold; padding: 5px;"></div>`; // Aisle spacer
                        }
                    }
                    
                    // Seat grid (30 rows)
                    for (let row = 1; row <= 30; row++) {
                        html += `<div style="text-align: center; font-weight: bold; padding: 5px;">${row}</div>`;
                        
                        for (let col = 0; col < 6; col++) {
                            const seatIndex = (row - 1) * 6 + col;
                            const seat = seatMap.seatMap[seatIndex];
                            const seatNumber = row + String.fromCharCode(65 + col);
                            const isAvailable = seat ? seat.available : false;
                            const isCurrentPassengerSeat = this.currentPassenger && 
                                                          this.currentPassenger.seatNumber === seatNumber;
                            
                            let bgColor = isAvailable ? '#dcfce7' : '#fee2e2';
                            let borderColor = isAvailable ? '#16a34a' : '#dc2626';
                            let cursor = isAvailable ? 'pointer' : 'not-allowed';
                            
                            if (isCurrentPassengerSeat) {
                                bgColor = '#dbeafe';
                                borderColor = '#2563eb';
                            }
                            
                            html += `
                                <div style="padding: 8px; border: 2px solid ${borderColor}; border-radius: 5px; 
                                     background: ${bgColor}; cursor: ${cursor}; text-align: center;"
                                     onclick="passengerManager.selectSeat('${seatNumber}', ${isAvailable})"
                                     title="${seatNumber} - ${isAvailable ? 'Available' : 'Occupied'}">
                                    ${seatNumber}
                                </div>
                            `;
                            
                            // Add aisle after 3rd column
                            if (col === 2) {
                                html += `<div style="padding: 8px;"></div>`; // Aisle spacer
                            }
                        }
                    }
                    
                    html += `
                            </div>
                            
                            <div style="margin-top: 20px; display: flex; gap: 10px;">
                                <button class="btn" onclick="passengerManager.autoAssignSeat()" 
                                        ${seatMap.availableSeats === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-magic"></i> Auto-Assign Seat
                                </button>
                                <button class="btn btn-success" onclick="passengerManager.confirmSeat()" id="confirm-seat-btn" disabled>
                                    <i class="fas fa-check"></i> Confirm Seat Selection
                                </button>
                            </div>
                        </div>
                    `;
                    
                    seatMapEl.innerHTML = html;
                },
                
                selectSeat(seatNumber, isAvailable) {
                    if (!isAvailable) {
                        app.showMessage('error', 'Seat is already occupied');
                        return;
                    }
                    
                    this.selectedSeat = seatNumber;
                    
                    // Update UI
                    document.querySelectorAll('[onclick*="selectSeat"]').forEach(el => {
                        el.style.borderWidth = '2px';
                    });
                    
                    const seatEl = [...document.querySelectorAll('[onclick*="selectSeat"]')].find(el => 
                        el.textContent === seatNumber
                    );
                    
                    if (seatEl) {
                        seatEl.style.borderWidth = '4px';
                        seatEl.style.borderColor = '#2563eb';
                    }
                    
                    // Enable confirm button
                    const confirmBtn = document.getElementById('confirm-seat-btn');
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                    }
                    
                    app.showMessage('info', `Selected seat: ${seatNumber}`);
                },
                
                async autoAssignSeat() {
                    if (!this.currentSeatMap) return;
                    
                    // Find first available seat
                    for (const seat of this.currentSeatMap.seatMap) {
                        if (seat.available) {
                            this.selectSeat(seat.seatNumber, true);
                            app.showMessage('info', `Auto-assigned seat: ${seat.seatNumber}`);
                            break;
                        }
                    }
                },
                
                async confirmSeat() {
                    if (!this.selectedSeat || !this.currentPassenger) {
                        app.showMessage('error', 'Please select a seat first');
                        return;
                    }

                    try {
                        await this.api.checkIn(this.currentPassenger.pnr, this.selectedSeat);
                        app.showMessage('success', `Check-in successful! Seat ${this.selectedSeat} assigned.`);
                        
                        // Refresh passenger details
                        await this.searchPassenger();
                        
                    } catch (error) {
                        app.showMessage('error', 'Check-in failed: ' + error.message);
                    }
                },
                
                showCheckinForm() {
                    const seatMapEl = document.getElementById('seat-map');
                    seatMapEl.innerHTML = `
                        <div class="message info">
                            <i class="fas fa-info-circle"></i>
                            <div>Please select a seat from the map below to complete check-in.</div>
                        </div>
                    `;
                    
                    if (this.currentPassenger && this.currentPassenger.flightNumber) {
                        this.loadSeatMap(this.currentPassenger.flightNumber);
                    }
                },
                
                changeSeat() {
                    if (!this.currentPassenger) return;
                    
                    this.showCheckinForm();
                    app.showMessage('info', 'Please select a new seat');
                },
                
                printBoardingPass() {
                    if (!this.currentPassenger) {
                        app.showMessage('error', 'No passenger selected');
                        return;
                    }
                    
                    const passenger = this.currentPassenger;
                    const printWindow = window.open('', '_blank');
                    
                    const html = `
                        <html>
                        <head>
                            <title>Boarding Pass - ${passenger.pnr}</title>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                .boarding-pass { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
                                .header { text-align: center; font-size: 24px; margin-bottom: 20px; }
                                .info { margin: 10px 0; }
                                .barcode { text-align: center; margin-top: 20px; font-family: monospace; font-size: 24px; }
                                @media print { 
                                    @page { margin: 0; } 
                                    body { margin: 0; padding: 10px; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="boarding-pass">
                                <div class="header">✈️ BOARDING PASS</div>
                                <div class="info"><strong>Passenger:</strong> ${passenger.passengerName}</div>
                                <div class="info"><strong>PNR:</strong> ${passenger.pnr}</div>
                                <div class="info"><strong>Flight:</strong> ${passenger.flightNumber}</div>
                                <div class="info"><strong>Seat:</strong> ${passenger.seatNumber || 'TBA'}</div>
                                <div class="info"><strong>Class:</strong> ${passenger.classType}</div>
                                <div class="info"><strong>Status:</strong> ${passenger.checkedIn ? 'CHECKED-IN' : 'NOT CHECKED-IN'}</div>
                                <div class="barcode">
                                    <div style="font-family: monospace; font-size: 24px; letter-spacing: 3px; margin: 20px 0;">
                                        ${passenger.pnr}
                                    </div>
                                    <div style="margin-top: 10px; font-size: 14px;">Scan at gate</div>
                                </div>
                            </div>
                            <script>
                                window.onload = function() {
                                    window.print();
                                    setTimeout(function() { window.close(); }, 1000);
                                };
                            </script>
                        </body>
                        </html>
                    `;
                    
                    printWindow.document.write(html);
                    printWindow.document.close();
                },
          createNewBooking() {
    // Load flights dynamically
    this.loadFlightsForBooking().then(flights => {
        const html = `
            <div class="modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div class="modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Create New Booking</h3>
                        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="display: grid; gap: 15px;">
                        <div>
                            <label>Passenger Name *</label>
                            <input type="text" id="new-passenger-name" placeholder="John Doe" class="form-control" style="width: 100%;">
                        </div>
                        <div>
                            <label>PNR Number *</label>
                            <input type="text" id="new-pnr" placeholder="PNR${Math.floor(Math.random() * 9000) + 1000}" class="form-control" style="width: 100%;" value="PNR${Math.floor(Math.random() * 9000) + 1000}">
                        </div>
                        <div>
                            <label>Email</label>
                            <input type="email" id="new-email" placeholder="john@example.com" class="form-control" style="width: 100%;">
                        </div>
                        <div>
                            <label>Flight Number *</label>
                            <select id="new-flight-number" class="form-control" style="width: 100%;">
                                <option value="">Select a flight</option>
                                ${flights && flights.length > 0 ? 
                                    flights.map(flight => 
                                        `<option value="${flight.flightNumber}">${flight.flightNumber} (${flight.origin} → ${flight.destination})</option>`
                                    ).join('') : 
                                    '<option value="">No flights available</option>'
                                }
                            </select>
                        </div>
                        <div>
                            <label>Class Type</label>
                            <select id="new-class-type" class="form-control" style="width: 100%;">
                                <option value="Economy">Economy</option>
                                <option value="Premium Economy">Premium Economy</option>
                                <option value="Business">Business</option>
                                <option value="First Class">First Class</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-success" onclick="passengerManager.submitNewBooking()">
                            <i class="fas fa-check"></i> Create Booking
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    }).catch(error => {
        console.error('Failed to load flights:', error);
        app.showMessage('error', 'Failed to load flights for booking');
    });
},

async loadFlightsForBooking() {
    try {
        console.log('🔄 Loading flights for booking...');
        const response = await this.api.getAllFlights();
        
        if (response.success && response.flights && response.flights.length > 0) {
            console.log(`✅ Loaded ${response.flights.length} flights for booking`);
            return response.flights;
        } else {
            console.warn('No flights found or empty response');
            return [];
        }
    } catch (error) {
        console.error('❌ Failed to load flights:', error);
        throw error;
    }
},
              
                async submitNewBooking() {
    const passengerName = document.getElementById('new-passenger-name').value;
    const pnr = document.getElementById('new-pnr').value;
    const email = document.getElementById('new-email').value;
    const flightNumber = document.getElementById('new-flight-number').value;
    const classType = document.getElementById('new-class-type').value;
    
    if (!passengerName || !pnr || !flightNumber) {
        app.showMessage('error', 'Please fill all required fields (*)');
        return;
    }
    
    const bookingData = {
        pnr: pnr.toUpperCase(),
        passengerName,
        email,
        flightNumber,
        classType
    };
    
    try {
        await this.api.createBooking(bookingData);
        app.showMessage('success', 'Booking created successfully!');
        document.querySelector('.modal').remove();
        
        // Auto-search the new booking
        document.getElementById('pnr-search').value = pnr;
        await this.searchPassenger();
        
    } catch (error) {
        app.showMessage('error', 'Failed to create booking: ' + error.message);
    }
},
                 scanQR() {
                    app.showMessage('info', 'QR scanning would be implemented with a camera API');
                }
            };
        }
        
        // Setup event listeners
        setTimeout(() => {
            document.getElementById('search-btn').addEventListener('click', () => {
                window.passengerManager.searchPassenger();
            });
            
            document.getElementById('pnr-search').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.passengerManager.searchPassenger();
                }
            });
        }, 100);
    }
async loadGatesPage() {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = `
        <div class="gates-page">
            <div class="section-header">
                <h2><i class="fas fa-door-closed"></i> Gate Management System</h2>
                <div class="btn-group">
                    <button class="btn" onclick="app.navigateTo('dashboard')">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                    <button class="btn btn-success" onclick="gateManager.getAvailableGates()">
                        <i class="fas fa-search"></i> Find Available Gate
                    </button>
                </div>
            </div>
            
            <div id="gates-container">
                <!-- Gates will be loaded here -->
                <div class="loader" style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                    <div>Loading gate information...</div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-tachometer-alt"></i> Gate Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #2563eb;" id="total-gates-count">0</div>
                        <div style="font-size: 14px; color: #6b7280;">Total Gates</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #10b981;" id="available-gates-count">0</div>
                        <div style="font-size: 14px; color: #6b7280;">Available Gates</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #f59e0b;" id="occupied-gates-count">0</div>
                        <div style="font-size: 14px; color: #6b7280;">Occupied Gates</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #ef4444;" id="maintenance-gates-count">0</div>
                        <div style="font-size: 14px; color: #6b7280;">Under Maintenance</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize gate manager
    if (!window.gateManager) {
        window.gateManager = {
            api: this.api,
            gates: [],
            
            async loadGates() {
                try {
                    const response = await this.api.getAllGates();
                    this.gates = response.gates || [];
                    this.renderGates();
                    
                    // Update ALL gate statistics
                    this.updateGateStatistics();
                    
                } catch (error) {
                    console.error('Error loading gates:', error);
                    document.getElementById('gates-container').innerHTML = `
                        <div class="message error">
                            <i class="fas fa-exclamation-circle"></i>
                            <div>Failed to load gates: ${error.message}</div>
                        </div>
                    `;
                    // Reset statistics on error
                    this.updateGateStatistics();
                }
            },
            
            updateGateStatistics() {
                if (!this.gates || this.gates.length === 0) {
                    // Reset to zeros if no gates
                    document.getElementById('total-gates-count').textContent = '0';
                    document.getElementById('available-gates-count').textContent = '0';
                    document.getElementById('occupied-gates-count').textContent = '0';
                    document.getElementById('maintenance-gates-count').textContent = '0';
                    return;
                }
                
                // Calculate statistics
                const totalGates = this.gates.length;
                const availableCount = this.gates.filter(g => !g.occupied).length;
                const occupiedCount = this.gates.filter(g => g.occupied).length;
                
                // Count maintenance gates (assuming status field exists or using occupied flag)
                // Note: Your server might not have 'MAINTENANCE' status, adjust as needed
                const maintenanceCount = this.gates.filter(g => g.status === 'MAINTENANCE').length;
                
                // Update UI
                document.getElementById('total-gates-count').textContent = totalGates;
                document.getElementById('available-gates-count').textContent = availableCount;
                document.getElementById('occupied-gates-count').textContent = occupiedCount;
                document.getElementById('maintenance-gates-count').textContent = maintenanceCount;
                
                console.log(`📊 Gate Statistics: ${totalGates} total, ${availableCount} available, ${occupiedCount} occupied, ${maintenanceCount} maintenance`);
            },
            
            renderGates() {
                const container = document.getElementById('gates-container');
                if (!container) return;
                
                // Group gates by terminal
                const gatesByTerminal = {};
                this.gates.forEach(gate => {
                    const terminal = gate.terminal || 'A'; // Default to 'A' if no terminal
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
                
                // Also update statistics after rendering
                this.updateGateStatistics();
            },
            
            renderGateCard(gate) {
                const statusClass = gate.occupied ? 'delayed' : 'on-time';
                const statusText = gate.occupied ? 'Occupied' : 'Available';
                const flightInfo = gate.currentFlight ? 
                    `<div style="font-size: 12px; color: #6b7280;">Flight: ${gate.currentFlight}</div>` : '';
                
                // Check if gate is under maintenance
                const isMaintenance = gate.status === 'MAINTENANCE';
                const maintenanceClass = isMaintenance ? 'maintenance' : '';
                const maintenanceText = isMaintenance ? 'MAINTENANCE' : statusText;
                
                return `
                    <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; background: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <div style="font-size: 20px; font-weight: 700; color: #1f2937;">${gate.gateNumber}</div>
                                ${flightInfo}
                            </div>
                            <span class="status ${isMaintenance ? 'maintenance' : statusClass}">${maintenanceText}</span>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            ${gate.occupied ? `
                                <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="gateManager.releaseGate('${gate.gateNumber}')">
                                    <i class="fas fa-door-open"></i> Release
                                </button>
                            ` : ''}
                            
                            ${!gate.occupied && !isMaintenance ? `
                                <button class="btn" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="gateManager.assignGateForm('${gate.gateNumber}')">
                                    <i class="fas fa-plane-arrival"></i> Assign
                                </button>
                            ` : ''}
                            
                            ${isMaintenance ? `
                                <button class="btn btn-warning" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="gateManager.reopenGate('${gate.gateNumber}')">
                                    <i class="fas fa-tools"></i> Reopen
                                </button>
                            ` : `
                                <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" 
                                        onclick="gateManager.maintenanceGate('${gate.gateNumber}')">
                                    <i class="fas fa-tools"></i> Maintenance
                                </button>
                            `}
                        </div>
                    </div>
                `;
            },
            
            async getAvailableGates() {
                try {
                    const response = await this.api.getAvailableGates();
                    this.showAvailableGatesModal(response.gates || []);
                } catch (error) {
                    app.showMessage('error', 'Failed to load available gates: ' + error.message);
                }
            },
            
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
                                            <button class="btn" onclick="gateManager.assignGateForm('${gate.gateNumber}')">
                                                Assign
                                            </button>
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
            },
            
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
            },
            
            async assignGate(gateNumber) {
                const flightNumber = document.getElementById('assign-flight-number').value.trim();
                
                if (!flightNumber) {
                    app.showMessage('error', 'Please enter a flight number');
                    return;
                }
                
                try {
                    await this.api.assignGate(flightNumber, gateNumber);
                    app.showMessage('success', `Gate ${gateNumber} assigned to flight ${flightNumber}`);
                    document.querySelector('.modal').remove();
                    await this.loadGates(); // Refresh gate list and statistics
                } catch (error) {
                    app.showMessage('error', 'Failed to assign gate: ' + error.message);
                }
            },
            
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
                    
                    app.showMessage('success', `Gate ${gateNumber} released`);
                    await this.loadGates(); // Refresh gate list and statistics
                } catch (error) {
                    app.showMessage('error', 'Failed to release gate: ' + error.message);
                }
            },
            
            async maintenanceGate(gateNumber) {
                if (!confirm(`Put gate ${gateNumber} under maintenance?`)) return;
                
                try {
                    // Simulate maintenance - in a real system, you'd call an API endpoint
                    const gate = this.gates.find(g => g.gateNumber === gateNumber);
                    if (gate) {
                        gate.status = 'MAINTENANCE';
                        gate.occupied = true; // Maintenance gates are considered occupied
                        this.updateGateStatistics();
                        this.renderGates(); // Re-render to show updated status
                    }
                    
                    app.showMessage('warning', `Gate ${gateNumber} marked for maintenance`);
                } catch (error) {
                    app.showMessage('error', 'Failed to set maintenance: ' + error.message);
                }
            },
            
            async reopenGate(gateNumber) {
                if (!confirm(`Reopen gate ${gateNumber} for service?`)) return;
                
                try {
                    // Simulate reopening - in a real system, you'd call an API endpoint
                    const gate = this.gates.find(g => g.gateNumber === gateNumber);
                    if (gate) {
                        gate.status = 'AVAILABLE';
                        gate.occupied = false;
                        this.updateGateStatistics();
                        this.renderGates(); // Re-render to show updated status
                    }
                    
                    app.showMessage('success', `Gate ${gateNumber} reopened for service`);
                } catch (error) {
                    app.showMessage('error', 'Failed to reopen gate: ' + error.message);
                }
            }
        };
    }
    
    // Load gates immediately
    setTimeout(() => {
        window.gateManager.loadGates();
    }, 100);
}
    
async loadRoutesPage() {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = `
        <div class="routes-page">
            <div class="section-header">
                <h2><i class="fas fa-route"></i> Route Finder</h2>
                <div class="btn-group">
                    <button class="btn" onclick="app.navigateTo('dashboard')">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                    <button class="btn btn-success" onclick="routeManager.printItinerary()">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-search-location"></i> Find Optimal Route</h3>
                <div class="input-group">
                    <div style="flex: 1;">
                        <label>From</label>
                        <select id="route-from" style="width: 100%;">
                            <option value="">Loading cities...</option>
                        </select>
                    </div>
                    
                    <div style="flex: 1;">
                        <label>To</label>
                        <select id="route-to" style="width: 100%;">
                            <option value="">Loading cities...</option>
                        </select>
                    </div>
                    
                    <div style="flex: 1;">
                        <label>Criteria</label>
                        <select id="route-criteria" style="width: 100%;">
                            <option value="shortest">Fastest Route</option>
                            <option value="cheapest">Cheapest Route</option>
                            <option value="fastest">Shortest Route</option>
                        </select>
                    </div>
                    
                    <div style="align-self: flex-end;">
                        <button class="btn" id="find-route-btn">
                            <i class="fas fa-route"></i> Find Route
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="route-result">
                <!-- Route results will appear here -->
                <div class="message info">
                    <i class="fas fa-info-circle"></i>
                    <div>Select origin, destination and criteria to find the optimal route</div>
                </div>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-city"></i> Available Cities</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;" id="cities-container">
                    <div class="loader" style="width: 100%; text-align: center; padding: 20px;">
                        <div class="spinner"></div>
                        <div>Loading cities...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize route manager
    if (!window.routeManager) {
        window.routeManager = {
            api: this.api,
            cities: [], // Will be loaded dynamically
            
            async loadCities() {
                try {
                    console.log('🌍 Loading cities from flights data...');
                    
                    // Get flights to extract cities
                    const response = await this.api.getAllFlights();
                    
                    if (response.success && response.flights && response.flights.length > 0) {
                        const citySet = new Set();
                        
                        // Extract unique cities from all flights
                        response.flights.forEach(flight => {
                            if (flight.origin) citySet.add(flight.origin);
                            if (flight.destination) citySet.add(flight.destination);
                        });
                        
                        this.cities = Array.from(citySet);
                        console.log(`✅ Loaded ${this.cities.length} cities:`, this.cities);
                        return this.cities;
                    } else {
                        console.warn('No flights found to extract cities');
                        return [];
                    }
                } catch (error) {
                    console.error('❌ Failed to load cities:', error);
                    return [];
                }
            },
            
            async populateCityDropdowns() {
                const fromSelect = document.getElementById('route-from');
                const toSelect = document.getElementById('route-to');
                const citiesContainer = document.getElementById('cities-container');
                
                // Clear existing
                fromSelect.innerHTML = '<option value="">Select origin</option>';
                toSelect.innerHTML = '<option value="">Select destination</option>';
                citiesContainer.innerHTML = '';
                
                // If no cities loaded yet, try to load them
                if (this.cities.length === 0) {
                    await this.loadCities();
                }
                
                // If still no cities, use fallback
                if (this.cities.length === 0) {
                    this.cities = ['ISL', 'LHR', 'DXB', 'JFK', 'FRA', 'SIN'];
                    console.log('⚠️ Using fallback cities');
                }
                
                // Remove duplicates
                const uniqueCities = [...new Set(this.cities)];
                
                // Add cities to dropdowns
                uniqueCities.forEach(city => {
                    const cityName = this.getCityName(city);
                    
                    fromSelect.innerHTML += `<option value="${city}">${city} (${cityName})</option>`;
                    toSelect.innerHTML += `<option value="${city}">${city} (${cityName})</option>`;
                    
                    // Add to cities display
                    citiesContainer.innerHTML += `
                        <div style="background: #f0f9ff; border-radius: 8px; padding: 12px 20px; display: flex; align-items: center; gap: 10px; min-width: 150px;">
                            <i class="fas fa-plane" style="color: #0ea5e9;"></i>
                            <div>
                                <div style="font-weight: 600;">${city}</div>
                                <div style="font-size: 12px; color: #6b7280;">${cityName}</div>
                            </div>
                        </div>
                    `;
                });
                
                // Set default selections if we have cities
                if (uniqueCities.length > 0) {
                    // Try to find common defaults
                    if (uniqueCities.includes('ISL') && uniqueCities.includes('JFK')) {
                        fromSelect.value = 'ISL';
                        toSelect.value = 'JFK';
                    } else if (uniqueCities.includes('LHR') && uniqueCities.includes('DXB')) {
                        fromSelect.value = 'LHR';
                        toSelect.value = 'DXB';
                    } else {
                        fromSelect.value = uniqueCities[0];
                        toSelect.value = uniqueCities.length > 1 ? uniqueCities[1] : uniqueCities[0];
                    }
                }
            },
            
            getCityName(cityCode) {
                const cityNames = {
                    'ISL': 'Islamabad',
                    'LHR': 'London Heathrow', 
                    'DXB': 'Dubai',
                    'JFK': 'New York JFK',
                    'FRA': 'Frankfurt',
                    'SIN': 'Singapore',
                    'JFK': 'New York',
                    'LAX': 'Los Angeles',
                    'CDG': 'Paris',
                    'HKG': 'Hong Kong',
                    'SYD': 'Sydney',
                    'YYZ': 'Toronto'
                };
                return cityNames[cityCode] || cityCode;
            },
            
            async findRoute() {
                const from = document.getElementById('route-from').value;
                const to = document.getElementById('route-to').value;
                const criteria = document.getElementById('route-criteria').value;

                if (!from || !to) {
                    app.showMessage('error', 'Please select origin and destination');
                    return;
                }

                if (from === to) {
                    app.showMessage('error', 'Origin and destination cannot be the same');
                    return;
                }

                const resultEl = document.getElementById('route-result');
                resultEl.innerHTML = '<div class="loader"><div class="spinner"></div>Finding optimal route...</div>';

                try {
                    const response = await this.api.findRoute(from, to, criteria);
                    this.renderRouteResult(response);
                } catch (error) {
                    resultEl.innerHTML = `
                        <div class="message error">
                            <i class="fas fa-exclamation-circle"></i>
                            <div>Failed to find route: ${error.message}</div>
                        </div>
                    `;
                }
            },
            
            renderRouteResult(response) {
                const resultEl = document.getElementById('route-result');
                
                if (!response.route) {
                    resultEl.innerHTML = `
                        <div class="message warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>No route found between selected cities</div>
                        </div>
                    `;
                    return;
                }

                const route = response.route;
                
                let html = `
                    <div class="route-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3>✅ Optimal Route Found</h3>
                            <span class="status on-time">${route.type ? route.type.toUpperCase() : 'DIRECT'}</span>
                        </div>
                        
                        <div style="font-size: 20px; font-weight: 600; margin-bottom: 15px; text-align: center;">
                            ${Array.isArray(route.path) ? 
                                route.path.map(city => `<span>${city}</span>`).join(' → ') : 
                                `${route.from || 'Origin'} → ${route.to || 'Destination'}`
                            }
                        </div>
                        
                        <div class="route-info">
                            <div class="route-item">
                                <i class="fas fa-route" style="color: #93c5fd;"></i>
                                <div>
                                    <div style="font-size: 12px; opacity: 0.8;">Distance</div>
                                    <div style="font-size: 18px; font-weight: 600;">${(route.distance || 0).toLocaleString()} km</div>
                                </div>
                            </div>
                            
                            <div class="route-item">
                                <i class="fas fa-clock" style="color: #93c5fd;"></i>
                                <div>
                                    <div style="font-size: 12px; opacity: 0.8;">Duration</div>
                                    <div style="font-size: 18px; font-weight: 600;">${Math.floor((route.duration || 0) / 60)}h ${(route.duration || 0) % 60}m</div>
                                </div>
                            </div>
                            
                            <div class="route-item">
                                <i class="fas fa-dollar-sign" style="color: #93c5fd;"></i>
                                <div>
                                    <div style="font-size: 12px; opacity: 0.8;">Price</div>
                                    <div style="font-size: 18px; font-weight: 600;">$${route.price || 0}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <strong>Flights:</strong> ${Array.isArray(route.flights) ? route.flights.join(' + ') : (route.flightId || 'N/A')}
                        </div>
                        
                        <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
                            <button class="btn" onclick="routeManager.findAlternatives()">
                                <i class="fas fa-exchange-alt"></i> View Alternatives
                            </button>
                            <button class="btn btn-success" onclick="routeManager.printItinerary()">
                                <i class="fas fa-print"></i> Print Itinerary
                            </button>
                        </div>
                    </div>
                `;

                resultEl.innerHTML = html;
            },
            
            findAlternatives() {
                const from = document.getElementById('route-from').value;
                const to = document.getElementById('route-to').value;
                
                if (!from || !to) return;
                
                // For now, use hardcoded alternatives until we have a proper API endpoint
                const alternatives = [
                    {
                        path: [from, 'DXB', to],
                        distance: 8900,
                        duration: 780,
                        price: 1200,
                        flights: ['PK123', 'EK303'],
                        type: 'Connecting'
                    },
                    {
                        path: [from, 'LHR', to],
                        distance: 9200,
                        duration: 900,
                        price: 1100,
                        flights: ['PK785', 'BA113'],
                        type: 'Connecting'
                    }
                ];
                
                this.renderAlternatives(alternatives);
            },
            
            renderAlternatives(alternatives) {
                const container = document.createElement('div');
                container.className = 'card';
                container.style.marginTop = '20px';
                container.innerHTML = `
                    <h3><i class="fas fa-route"></i> Alternative Routes</h3>
                    <div style="margin-top: 20px;">
                        ${alternatives.map((alt, index) => `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #f8fafc;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div style="font-weight: 600;">Option ${index + 1}: ${alt.path.join(' → ')}</div>
                                    <button class="btn" style="padding: 6px 12px; font-size: 12px;" 
                                            onclick="routeManager.selectAlternative(${JSON.stringify(alt).replace(/"/g, '&quot;')})">
                                        Select
                                    </button>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 14px;">
                                    <div><strong>Distance:</strong> ${alt.distance.toLocaleString()} km</div>
                                    <div><strong>Duration:</strong> ${Math.floor(alt.duration / 60)}h ${alt.duration % 60}m</div>
                                    <div><strong>Price:</strong> $${alt.price}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                document.getElementById('route-result').appendChild(container);
            },
            
            selectAlternative(route) {
                const resultEl = document.getElementById('route-result');
                resultEl.innerHTML = '<div class="loader"><div class="spinner"></div>Loading selected route...</div>';
                
                setTimeout(() => {
                    this.renderRouteResult({ route });
                }, 500);
            },
            
            printItinerary() {
                const from = document.getElementById('route-from').value;
                const to = document.getElementById('route-to').value;
                
                if (!from || !to) {
                    app.showMessage('error', 'Please select a route first');
                    return;
                }
                
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Flight Itinerary</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .itinerary { max-width: 500px; margin: 0 auto; }
                            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
                            .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
                            .flight-leg { border-left: 3px solid #2563eb; padding-left: 15px; margin: 15px 0; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
                            @media print { 
                                @page { margin: 0; } 
                                body { margin: 0.5cm; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="itinerary">
                            <div class="header">
                                <h1>✈️ Flight Itinerary</h1>
                                <div>Generated on ${new Date().toLocaleDateString()}</div>
                            </div>
                            
                            <div class="section">
                                <h3>Travel Summary</h3>
                                <div><strong>From:</strong> ${from}</div>
                                <div><strong>To:</strong> ${to}</div>
                                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                            </div>
                            
                            <div class="section">
                                <h3>Flights</h3>
                                <div class="flight-leg">
                                    <div><strong>Flight:</strong> PK785</div>
                                    <div><strong>Route:</strong> ${from} → DXB</div>
                                    <div><strong>Time:</strong> 08:00 - 14:00</div>
                                    <div><strong>Duration:</strong> 6 hours</div>
                                </div>
                                <div class="flight-leg">
                                    <div><strong>Flight:</strong> EK202</div>
                                    <div><strong>Route:</strong> DXB → ${to}</div>
                                    <div><strong>Time:</strong> 16:15 - 20:15</div>
                                    <div><strong>Duration:</strong> 4 hours</div>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p>Thank you for choosing our airline service!</p>
                                <p>For assistance, contact: support@airport-system.com</p>
                            </div>
                        </div>
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 1000);
                            };
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        };
    }
    
    // Setup cities dropdowns and event listeners
    setTimeout(async () => {
        try {
            // Populate cities dropdowns
            await window.routeManager.populateCityDropdowns();
            
            // Setup event listener for find route button
            document.getElementById('find-route-btn').addEventListener('click', () => {
                window.routeManager.findRoute();
            });
            
            // Also allow Enter key in selects
            document.getElementById('route-from').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.routeManager.findRoute();
            });
            document.getElementById('route-to').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') window.routeManager.findRoute();
            });
            
        } catch (error) {
            console.error('Failed to setup routes page:', error);
            app.showMessage('error', 'Failed to load routes page: ' + error.message);
        }
    }, 100);
}
    async loadStatsPage() {
        const contentEl = document.getElementById('content');
        contentEl.innerHTML = `
            <div class="stats-page">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> System Analytics Dashboard</h2>
                    <div class="btn-group">
                        <button class="btn" onclick="app.navigateTo('dashboard')">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                        <button class="btn" id="refresh-stats">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button class="btn btn-success" id="export-report">
                            <i class="fas fa-file-export"></i> Export Report
                        </button>
                    </div>
                </div>
                
                <div id="system-overview">
                    <!-- System overview stats will be loaded here -->
                </div>
                
                <div id="system-performance" style="margin-top: 25px;">
                    <!-- Performance metrics will be loaded here -->
                </div>
                
                <div id="current-load" style="margin-top: 25px;">
                    <!-- Current load stats will be loaded here -->
                </div>
                
                <div id="data-structures-info" style="margin-top: 25px;">
                    <!-- Data structures info will be loaded here -->
                </div>
            </div>
        `;
        
        // Initialize stats manager
        if (!window.statsManager) {
            window.statsManager = {
                api: this.api,
                
                async loadStats() {
                    try {
                        const statsData = await this.api.getStats();
                        this.renderStats(statsData);
                    } catch (error) {
                        console.error('Error loading stats:', error);
                    }
                },
                
                renderStats(statsData) {
                    const stats = statsData.stats || {};
                    
                    // System Overview
                    document.getElementById('system-overview').innerHTML = `
                        <div class="dashboard-grid">
                            <div class="stat-card">
                                <h3><i class="fas fa-plane"></i> Active Flights</h3>
                                <div class="number">${stats.totalFlights || 0}</div>
                                <div class="label">Currently scheduled</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-users"></i> Total Passengers</h3>
                                <div class="number">${stats.totalPassengers || 0}</div>
                                <div class="label">In system</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-check-circle"></i> Checked-in</h3>
                                <div class="number">${stats.checkedInPassengers || 0}</div>
                                <div class="label">Ready to board</div>
                            </div>
                            
                            <div class="stat-card">
                                <h3><i class="fas fa-chair"></i> Seat Availability</h3>
                                <div class="number">${stats.availableSeats || 0}</div>
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
                                    <div style="font-size: 24px; font-weight: 600;">${stats.connectionsHandled || 0}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Requests Processed</div>
                                    <div style="font-size: 24px; font-weight: 600;">${stats.requestsProcessed || 0}</div>
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

                    // Data Structures Info
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
            };
        }
        
        // Load stats immediately and setup event listeners
        setTimeout(() => {
            window.statsManager.loadStats();
            
            document.getElementById('refresh-stats').addEventListener('click', () => {
                window.statsManager.loadStats();
                app.showMessage('info', 'Statistics refreshed');
            });
        }, 100);
    }

    async refreshDashboard() {
        this.showMessage('info', 'Refreshing dashboard data...');
        await this.loadDashboard();
    }

    showMessage(type, text) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div>${text}</div>
        `;
        
        const content = document.querySelector('.content');
        if (content) {
            content.prepend(messageEl);
            
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 5000);
        }
    }

    setupAutoRefresh() {
        // Auto-refresh flights every 30 seconds if on flights page
        setInterval(async () => {
            if (this.currentPage === 'flights' && window.flightsManager) {
                await window.flightsManager.loadFlightsByTimeRange();
            }
        }, 30000);
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AirportSystem();
});