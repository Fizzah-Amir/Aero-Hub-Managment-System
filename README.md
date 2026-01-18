                                                                    Aero Hub Management System
A full-stack airport management system with Railway-deployed backend,for efficient flight operations, booking management, and route optimization.
Overview
An enterprise-grade airport management platform that handles flight scheduling, passenger bookings, gate assignments, and route optimization. Built with C++ backend, deployed on Railway, with a modern web frontend.
 Key Features
 Data Structures and thier uses in Project;
- B-Tree flight/passenger/gate lookups and insertions
- Dijkstra's Algo: Find cheapest flight routes by cost and time
- Hash Map :seat allocation and availability checks
- Linked Lists  booking queue management
- Graph Data Structure Flight route network
- bitmap if seat is occupied or free
- persistent storage to `.dat` files
 Flight Management
- Add, update, and delete flights
- Real-time flight schedule management
- Automatic gate assignment
- Flight status tracking
- CSV data import for bulk operations

 Passenger Management
- Passenger registration and profile management
- Booking history tracking
- Seat selection and allocation
- Check-in system

 Booking System
- Create and manage flight bookings
- Seat map visualization
- Multi-leg journey support
- Booking cancellation and modifications

 Gate Management
- Dynamic gate allocation
- Gate schedule conflict resolution
- Gate availability tracking

 Route 
- **Cheapest Path**: Find minimum cost routes using Dijkstra
- **Fastest Path**: Optimize by travel time
- Multi-city route planning
- Alternative route suggestions

 Tech Stack
 Backend
- Language: C++ 
- Server: Custom HTTP server
- Deployment: Railway 
- Data Storage: File-based with B-Tree indexing

Frontend
- **HTML5/CSS**:  UI
- **JavaScript**: Client-side logic and API integration
- RESTful API: Backend communication

Data Structures Implemented
- B-Tree (order 5)
- adjacency List Graph 
- Hash Map 
- Linked List 
- Priority Queue 
- Bitmap
