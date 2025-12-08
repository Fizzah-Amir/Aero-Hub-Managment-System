FROM gcc:12.2.0

WORKDIR /app
COPY . .

RUN g++ -o server main.cpp FlightServer.cpp -std=c++17 -pthread

EXPOSE 8080
CMD ./server ${PORT:-8080}