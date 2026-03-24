FROM node:22-alpine

WORKDIR /app

# Copy package files from parent or local? 
# Usually, in monorepo, we might need a specific strategy.
# But for this task, I'll assume standard standalone build.
COPY package*.json ./
RUN npm ci

COPY . .

# Compile only the compose-safe backend runtime
RUN npm run build:docker

EXPOSE 3000

CMD ["npm", "run", "start:docker"]
