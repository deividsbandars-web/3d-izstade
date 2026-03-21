FROM node:22-alpine

WORKDIR /app

# Copy package files from parent or local? 
# Usually, in monorepo, we might need a specific strategy.
# But for this task, I'll assume standard standalone build.
COPY package*.json ./
RUN npm ci

COPY . .

# Compile TypeScript
RUN npx tsc

EXPOSE 3000

CMD ["node", "dist/server.js"]
