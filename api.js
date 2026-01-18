class FlightAPI {
    constructor() {
        this.baseURL = "http://localhost:8080/api";
        console.log(' FlightAPI initialized with base URL:', this.baseURL);
    }

    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        console.log(`🌐 API Call: ${method} ${url}`, data || '');
        
        const options = {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            console.log(`📥 Response for ${endpoint}:`, response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status} for ${url}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
            }
            
            const result = await response.json();
            console.log(`✅ Success for ${endpoint}:`, result);
            return result;
            
        } catch (error) {
            console.error('❌ API Request Failed:', error);
            throw error;
        }
    }

    

    async checkHealth() {
        return this.request('/health');
    }

    async getAllFlights() {
        return this.request('/flights');
    }

    async getFlightsByTimeRange(startTime, endTime) {
        return this.request(`/flights/range?start=${startTime}&end=${endTime}`);
    }


    async getPassenger(pnr) {
        return this.request(`/passenger/${pnr}`);
    }

   
   async checkIn(pnr, seatNumber) {
    return this.request(`/bookings/${pnr}/checkin`, 'PUT', { seatNumber });
   }

    async getAllBookings() {
        return this.request('/bookings');
    }

    async createBooking(bookingData) {
        return this.request('/bookings', 'POST', bookingData);
    }

    async getAllGates() {
        return this.request('/gates');
    }

    async getAvailableGates(min = 1, max = 20) {
        console.log('🔄 Mock available gates');
        return {
            success: true,
            gates: [
                { gateNumber: 'A01', terminal: 'A', occupied: false },
                { gateNumber: 'B12', terminal: 'B', occupied: false },
                { gateNumber: 'C23', terminal: 'C', occupied: false }
            ]
        };
    }

    async assignGate(flightNumber, gateNumber) {
        console.log(`🔄 Mock assign gate: ${flightNumber} -> ${gateNumber}`);
        return {
            success: true,
            message: `Mock: Gate ${gateNumber} assigned to ${flightNumber}`
        };
    }

async findRoute(from, to, criteria = 'shortest') {
  
    let endpoint;
    
    switch(criteria) {
        case 'cheapest':
            endpoint = `/routes/cheapest?from=${from}&to=${to}`;
            break;
        case 'fastest':
            endpoint = `/routes/fastest?from=${from}&to=${to}`;
            break;
        case 'shortest':
        default:
            endpoint = `/routes/shortest?from=${from}&to=${to}`;
            break;
    }
    
    console.log(`🔍 findRoute called: from=${from}, to=${to}, criteria=${criteria}`);
    console.log(`🔍 Using endpoint: ${endpoint}`);
    
    return this.request(endpoint);
}
   


    
    async getSeatMap(flightNumber) {
        console.log(`🔄 Mock seat map for: ${flightNumber}`);
        return this.generateMockSeatMap(flightNumber);
    }

    async getStats() {
        return this.request('/stats');
    }

   
    async getFlight(flightNumber) {
        console.log(`🔄 Mock flight details for: ${flightNumber}`);
        return {
            success: true,
            flight: {
                flightNumber,
                airline: 'Mock Airlines',
                origin: 'JFK',
                destination: 'LAX',
                departureTime: '14:30',
                gate: 'A12',
                seats: 180,
                price: 500
            }
        };
    }

    async addFlight(flightData) {
        console.log('🔄 Mock add flight:', flightData);
        return {
            success: true,
            message: `Mock: Flight ${flightData.flightNumber} added`
        };
    }

    async deleteFlight(flightNumber) {
        console.log(`🔄 Mock delete flight: ${flightNumber}`);
        return {
            success: true,
            message: `Mock: Flight ${flightNumber} deleted`
        };
    }
    generateMockSeatMap(flightNumber) {
        const seats = [];
        const rows = 30;
        const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let row = 1; row <= rows; row++) {
            for (let col = 0; col < columns.length; col++) {
                const seatLetter = columns[col];
                const seatNumber = `${row}${seatLetter}`;
                const available = Math.random() > 0.4; 
                
                seats.push({
                    seatNumber,
                    available,
                    class: row <= 5 ? 'Business' : 'Economy'
                });
            }
        }
        
        const availableSeats = seats.filter(s => s.available).length;
        
        return {
            success: true,
            flightNumber,
            totalSeats: rows * columns.length,
            availableSeats,
            occupiedSeats: rows * columns.length - availableSeats,
            seatMap: seats,  
            seats: seats     
        };
    }

    async testAllEndpoints() {
        console.log('🧪 Testing API endpoints...');
        
        const tests = [
            { name: 'Health', fn: () => this.checkHealth() },
            { name: 'Flights', fn: () => this.getAllFlights() },
            { name: 'Stats', fn: () => this.getStats() },
            { name: 'Gates', fn: () => this.getAllGates() },
            { name: 'Bookings', fn: () => this.getAllBookings() },
            { name: 'Passenger PNR7179', fn: () => this.getPassenger('PNR7179') },
        ];
        
        for (const test of tests) {
            try {
                console.log(`Testing ${test.name}...`);
                const result = await test.fn();
                console.log(`✅ ${test.name}:`, result.success !== undefined ? 'Success' : 'OK');
            } catch (error) {
                console.log(`❌ ${test.name}:`, error.message);
            }
        }
    }

}


window.FlightAPI = new FlightAPI();
console.log('✅ FlightAPI ready! Use window.FlightAPI');


setTimeout(() => {
    if (window.FlightAPI) {
        window.FlightAPI.testAllEndpoints().catch(() => {});
    }
}, 2000);