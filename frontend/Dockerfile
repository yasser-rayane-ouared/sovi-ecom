FROM node:20-alpine AS base

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

EXPOSE 3000

CMD ["sh", "-c", "NODE_OPTIONS=\"--max-old-space-size=450\" npm run build && npm run start"]
