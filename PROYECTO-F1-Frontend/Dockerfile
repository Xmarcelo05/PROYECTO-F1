# --- Etapa 1: build ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servir con nginx ---
FROM nginx:alpine

# Config de nginx que escucha en el puerto que Cloud Run inyecta (PORT=8080 por defecto)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# Reemplaza $PORT en runtime (Cloud Run puede cambiarlo) y arranca nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
