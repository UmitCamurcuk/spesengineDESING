# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cached)
COPY package*.json ./
RUN npm ci

# App source
COPY . .

# Build-time env for Vite (must be available during `npm run build`)
ARG VITE_API_BASE_URL
ARG VITE_ASSET_BASE_URL
ARG VITE_APP_ENVIRONMENT
ARG VITE_ENABLE_MOCK_API
ARG VITE_LOG_LEVEL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ASSET_BASE_URL=${VITE_ASSET_BASE_URL}
ENV VITE_APP_ENVIRONMENT=${VITE_APP_ENVIRONMENT}
ENV VITE_ENABLE_MOCK_API=${VITE_ENABLE_MOCK_API}
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL}

RUN npm run build

# Serve stage
FROM nginx:alpine

# Static files
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: cache-friendly defaults (safe)
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '}' \
  > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
