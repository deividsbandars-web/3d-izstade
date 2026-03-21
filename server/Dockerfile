FROM node:22-alpine

WORKDIR /app

# Since server/ has no package.json, we use root dependencies
COPY ../package*.json ./
RUN npm ci

COPY . .

# Run directly via tsx or compile? 
# Production usually uses compiled JS.
RUN npx tsc syncServer.ts --outDir dist

EXPOSE 8888

CMD ["node", "dist/syncServer.js"]
