# ---------- Etapa 1: Build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos solo los archivos de dependencias primero (cache de capas)
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código fuente
COPY . .

# Variable de entorno para la URL del backend en build time
# Vite necesita que las env vars empiecen con VITE_ y estén disponibles en build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 2: Servir con Nginx ----------
FROM nginx:1.27-alpine

# Config de nginx que respeta el $PORT de Cloud Run
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run inyecta PORT (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
