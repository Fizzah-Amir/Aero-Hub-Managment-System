FROM ubuntu:latest

RUN apt-get update && apt-get install -y \
    g++ \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Compile ALL required .cpp files together
RUN echo "=== Compiling all source files ===" && \
    g++ -o server \
        # Main file
        source/data_structures/functionalities/test_complete_system.cpp \
        # Flight entities
        source/data_structures/flight_entities/flight.cpp \
        source/data_structures/flight_entities/booking.cpp \
        source/data_structures/flight_entities/passenger.cpp \
        source/data_structures/flight_entities/gate.cpp \
        source/data_structures/flight_entities/seat.cpp \
        # Data structures
        source/data_structures/Btree.cpp \
        source/data_structures/node.cpp \
        source/data_structures/storage_manager.cpp \
        # Functionalities
        source/data_structures/functionalities/flight_functions.cpp \
        source/data_structures/functionalities/gate_functions.cpp \
        source/data_structures/functionalities/passenger_functions.cpp \
        source/data_structures/functionalities/graph.cpp \
        # Flags
        -std=c++17 \
        -pthread \
        -I/app \
        -I/app/source/data_structures \
        -I/app/source/data_structures/flight_entities \
        -I/app/source/data_structures/functionalities \
        2>&1 | tee compile.log

# Check if compilation succeeded
RUN if [ -f "/app/server" ]; then \
        echo "=== Compilation SUCCESS ===" && \
        ls -la /app/server; \
    else \
        echo "=== Compilation FAILED ===" && \
        cat /app/compile.log && \
        exit 1; \
    fi

EXPOSE 8080
CMD ["./server", "8080"]
