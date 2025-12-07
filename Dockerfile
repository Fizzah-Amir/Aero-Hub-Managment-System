FROM ubuntu:latest

RUN apt-get update && apt-get install -y \
    g++ \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# First, find all .cpp files needed
RUN echo "=== Listing all CPP files ===" && \
    find . -name "*.cpp" | sort

# Try to compile test_complete_system.cpp with proper includes
RUN echo "=== Attempting compilation ===" && \
    cd /app && \
    g++ -o server \
        source/data_structures/functionalities/test_complete_system.cpp \
        -std=c++11 \
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
