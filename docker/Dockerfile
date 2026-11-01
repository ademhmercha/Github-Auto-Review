# syntax=docker/dockerfile:1

# ---------- Étape 1 : build de l'application ----------
FROM node:24-alpine AS build
WORKDIR /app

# Copier d'abord les fichiers de dépendances pour profiter du cache Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copier le reste du code et compiler
COPY . .
RUN npm run build

# ---------- Étape 2 : image finale légère ----------
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime

# Applique les correctifs de sécurité Alpine publiés depuis la création de l'image de base
USER root
RUN apk upgrade --no-cache
USER 101

LABEL org.opencontainers.image.title="github-auto-review" \
      org.opencontainers.image.source="https://github.com/ademhmercha/Github-Auto-Review"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# L'image unprivileged tourne déjà en utilisateur non root, sur le port 8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1