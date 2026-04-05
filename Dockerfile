# syntax=docker/dockerfile:1.7

# Base image for building
FROM node:22-alpine AS builder

# Install build dependencies for native modules like 'canvas'
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

WORKDIR /app

ARG VITE_PUBLIC_API_BASE_URL=
ARG VITE_SIGNALING_SERVER_URL=ws://localhost/ws/
ARG VITE_STUN_SERVER_URLS=
ARG VITE_TURN_SERVER_URLS=
ARG VITE_TURN_USERNAME=
ARG VITE_TURN_PASSWORD=
ENV VITE_PUBLIC_API_BASE_URL=${VITE_PUBLIC_API_BASE_URL}
ENV VITE_SIGNALING_SERVER_URL=${VITE_SIGNALING_SERVER_URL}
ENV VITE_STUN_SERVER_URLS=${VITE_STUN_SERVER_URLS}
ENV VITE_TURN_SERVER_URLS=${VITE_TURN_SERVER_URLS}
ENV VITE_TURN_USERNAME=${VITE_TURN_USERNAME}
ENV VITE_TURN_PASSWORD=${VITE_TURN_PASSWORD}

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --prefer-offline

# Copy only the frontend build inputs.
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

# Build the project
RUN npm run build

# Production image
FROM nginx:alpine AS runner

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deployment/configs/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
