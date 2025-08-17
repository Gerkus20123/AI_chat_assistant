# Użycie oficjalnego obrazu Node.js
FROM node:18

# Ustawienie katalogu roboczego w kontenerze
WORKDIR /app

# Kopiowanie plików package.json i package-lock.json
COPY package*.json ./

# Instalacja zależności
RUN npm install

# Kopiowanie reszty plików projektu
COPY . .

# Uruchamianie serwera
CMD [ "node", "app.js" ]