FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js .
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD wget -q -O- http://localhost:3001/health || exit 1
CMD ["node", "server.js"]
