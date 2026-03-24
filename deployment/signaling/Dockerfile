FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 80
EXPOSE 8888
EXPOSE 8889

CMD ["npm", "start", "--", "--streamer_port", "8888", "--player_port", "80", "--sfu_port", "8889", "--serve", "--log_config"]
