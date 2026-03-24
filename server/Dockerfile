FROM node:22-alpine

WORKDIR /app

# Install only the sync-server dependency tree.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./tsconfig.json
COPY syncServer.ts ./syncServer.ts

RUN npm run build

EXPOSE 8890

CMD ["npm", "run", "start"]
