FROM node:20-alpine AS base

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

# Declare build arguments (Railway automatically passes environment variables as ARGs)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ROOT_DOMAIN

# Convert build arguments to environment variables so Next.js can read them during build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN

COPY frontend/ .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
