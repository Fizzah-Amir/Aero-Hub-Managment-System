import csv
import random
from datetime import datetime, timedelta
import uuid

# Configuration - FIXED RATIOS
NUM_FLIGHTS =200
NUM_PASSENGERS = 1000
NUM_GATES = 50  # Increased from 100 to handle more flights
NUM_ROUTES = 200

# Data pools
AIRLINES = [
    "Pakistan Airlines", "Emirates", "Qatar Airways", "Turkish Airlines",
    "Saudi Arabian", "Etihad", "Air China", "Singapore Airlines",
    "British Airways", "Lufthansa", "Air France", "American Airlines",
    "Delta", "United", "Cathay Pacific", "Qantas", "ANA", "Korean Air"
]

CITIES = {
    "ISL": "Islamabad", "LHE": "Lahore", "KHI": "Karachi", "PEW": "Peshawar",
    "DXB": "Dubai", "AUH": "Abu Dhabi", "DOH": "Doha", "IST": "Istanbul",
    "JED": "Jeddah", "RUH": "Riyadh", "BKK": "Bangkok", "SIN": "Singapore",
    "KUL": "Kuala Lumpur", "HKG": "Hong Kong", "NRT": "Tokyo", "ICN": "Seoul",
    "LHR": "London", "CDG": "Paris", "FRA": "Frankfurt", "AMS": "Amsterdam",
    "JFK": "New York", "LAX": "Los Angeles", "ORD": "Chicago", "YYZ": "Toronto",
    "SYD": "Sydney", "MEL": "Melbourne"
}

FIRST_NAMES = ["Ali", "Ahmed", "Mohammad", "Hassan", "Omar", "Usman", "Bilal", "Kamran",
               "Sara", "Fatima", "Ayesha", "Zainab", "Maryam", "Hina", "Sana", "Nadia"]

LAST_NAMES = ["Khan", "Ahmed", "Malik", "Raza", "Hussain", "Shah", "Butt", "Chaudhry",
              "Ali", "Rehman", "Sheikh", "Hashmi", "Qureshi", "Mirza", "Baig"]

SEAT_CLASSES = ["Economy", "Business", "First"]
STATUSES = ["Scheduled", "On-time", "Delayed", "Cancelled"]
TERMINALS = ["A", "B", "C", "D"]

# Generate flight codes
def generate_flight_code(airline):
    prefixes = {
        "Pakistan Airlines": "PK", "Emirates": "EK", "Qatar Airways": "QR",
        "Turkish Airlines": "TK", "Saudi Arabian": "SV", "Etihad": "EY",
        "Air China": "CA", "Singapore Airlines": "SQ", "British Airways": "BA",
        "Lufthansa": "LH", "Air France": "AF", "American Airlines": "AA",
        "Delta": "DL", "United": "UA", "Cathay Pacific": "CX", "Qantas": "QF",
        "ANA": "NH", "Korean Air": "KE"
    }
    prefix = prefixes.get(airline, "XX")
    number = random.randint(100, 999)
    return f"{prefix}{number}"

# Generate time
def generate_time():
    hour = random.randint(0, 23)
    minute = random.choice([0, 15, 30, 45])
    return f"{hour:02d}:{minute:02d}"

# Generate price based on distance
def generate_price(distance):
    base = distance * 0.1
    variation = random.uniform(0.8, 1.2)
    return round(base * variation, 2)

# Generate seats
def generate_seats():
    return random.choice([120, 150, 180, 200, 250, 300])

# 1. Generate flights.csv
print("Generating flights.csv...")
flights = []
with open('flights.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'airline', 'origin', 'destination', 'departure', 
                     'arrival', 'gate', 'price', 'seats', 'status'])
    
    for i in range(NUM_FLIGHTS):
        airline = random.choice(AIRLINES)
        flight_id = generate_flight_code(airline)
        origin = random.choice(list(CITIES.keys()))
        destination = random.choice([c for c in CITIES.keys() if c != origin])
        departure = generate_time()
        duration_hours = random.randint(1, 12)
        arrival_hour = (int(departure.split(':')[0]) + duration_hours) % 24
        arrival = f"{arrival_hour:02d}:{random.choice([0, 15, 30, 45]):02d}"
        
        # Gate assignment - will be updated later
        gate = ""  # We'll assign gates separately
        
        distance = random.randint(500, 12000)
        price = generate_price(distance)
        seats = generate_seats()
        status = random.choice(STATUSES)
        
        flights.append({
            'id': flight_id,
            'airline': airline,
            'origin': origin,
            'destination': destination,
            'departure': departure,
            'arrival': arrival,
            'gate': gate,
            'price': price,
            'seats': seats,
            'status': status
        })
        
        writer.writerow([flight_id, airline, origin, destination, departure,
                        arrival, gate, price, seats, status])

print(f"Generated {NUM_FLIGHTS} flights")

# 2. Generate gates.csv - FIXED LOGIC
print("\nGenerating gates.csv...")
with open('gates.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['gate_number', 'terminal', 'status', 'flight_id'])
    
    # Create all gates
    all_gates = []
    for i in range(1, NUM_GATES + 1):
        terminal = random.choice(TERMINALS)
        gate_number = f"{terminal}{i:02d}"
        all_gates.append(gate_number)
    
    # Assign some flights to gates (max 70% occupancy)
    max_occupied = min(len(flights), int(NUM_GATES * 0.7))
    flights_to_assign = random.sample(flights, max_occupied)
    
    occupied_gates = random.sample(all_gates, max_occupied)
    
    # Create gate status map
    gate_status = {}
    for i, gate in enumerate(all_gates):
        if i < len(occupied_gates) and i < len(flights_to_assign):
            gate_status[gate] = {
                'status': 'Occupied',
                'flight_id': flights_to_assign[i]['id'],
                'terminal': gate[0]
            }
        else:
            gate_status[gate] = {
                'status': random.choice(['Available', 'Available', 'Available', 'Maintenance']),
                'flight_id': '',
                'terminal': gate[0]
            }
    
    # Write gates
    for gate, info in gate_status.items():
        writer.writerow([gate, info['terminal'], info['status'], info['flight_id']])
        
        # Update flight with gate assignment
        if info['flight_id']:
            for flight in flights:
                if flight['id'] == info['flight_id']:
                    flight['gate'] = gate

print(f"Generated {NUM_GATES} gates ({max_occupied} occupied)")

# 3. Update flights.csv with gate assignments
print("\nUpdating flights.csv with gate assignments...")
with open('flights.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'airline', 'origin', 'destination', 'departure', 
                     'arrival', 'gate', 'price', 'seats', 'status'])
    
    for flight in flights:
        writer.writerow([
            flight['id'], flight['airline'], flight['origin'], flight['destination'],
            flight['departure'], flight['arrival'], flight['gate'], flight['price'],
            flight['seats'], flight['status']
        ])

# 4. Generate passengers.csv
print("\nGenerating passengers.csv...")
with open('passengers.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['pnr', 'name', 'email', 'flight_id', 'seat', 'checked_in'])
    
    for i in range(NUM_PASSENGERS):
        pnr = f"PNR{random.randint(100000, 999999)}"
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = f"{first.lower()}.{last.lower()}@example.com"
        
        flight = random.choice(flights)
        flight_id = flight['id']
        
        # Generate seat
        row = random.randint(1, 40)
        seat_letter = random.choice(['A', 'B', 'C', 'D', 'E', 'F'])
        seat = f"{row}{seat_letter}"
        
        checked_in = random.choice([0, 1])
        
        writer.writerow([pnr, name, email, flight_id, seat, checked_in])

print(f"Generated {NUM_PASSENGERS} passengers")

# 5. Generate routes.csv
print("\nGenerating routes.csv...")
with open('routes.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['from', 'to', 'distance', 'price', 'duration', 'flight_id'])
    
    routes_set = set()
    for _ in range(NUM_ROUTES):
        origin = random.choice(list(CITIES.keys()))
        destination = random.choice([c for c in CITIES.keys() if c != origin])
        
        # Avoid duplicate routes
        route_key = f"{origin}-{destination}"
        if route_key in routes_set:
            continue
        routes_set.add(route_key)
        
        distance = random.randint(200, 15000)
        price = generate_price(distance)
        duration = distance // 800  # Approximate hours
        
        # Assign to a flight that matches this route
        matching_flights = [f for f in flights if f['origin'] == origin and f['destination'] == destination]
        if matching_flights:
            flight_id = random.choice(matching_flights)['id']
        else:
            flight_id = random.choice(flights)['id']
        
        writer.writerow([origin, destination, distance, price, duration, flight_id])

print(f"Generated {len(routes_set)} unique routes")

print("\n✅ Data generation complete!")
print(f"📊 Summary:")
print(f"   Flights: {NUM_FLIGHTS}")
print(f"   Passengers: {NUM_PASSENGERS}")
print(f"   Gates: {NUM_GATES} ({max_occupied} occupied)")
print(f"   Routes: {len(routes_set)}")
print(f"   Cities: {len(CITIES)}")
print(f"   Airlines: {len(AIRLINES)}")
print(f"   Data size: ~{NUM_FLIGHTS * 0.1 + NUM_PASSENGERS * 0.08:.1f} MB")