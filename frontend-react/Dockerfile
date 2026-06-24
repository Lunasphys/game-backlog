FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# build url public api
ENV VITE_API_URL=http://api.192.168.49.2.nip.io/api
ENV VITE_WS_URL=http://ws.192.168.49.2.nip.io
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]