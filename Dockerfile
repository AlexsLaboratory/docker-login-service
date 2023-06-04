FROM node:18.16.0-alpine3.16 AS builder
ENV NODE_ENV=development
WORKDIR /app
COPY package.json .
COPY tsconfig.json .
COPY config.yml .
COPY webpack.config.js .
RUN npm install
COPY src ./src
RUN npm run build:prod

FROM node:18.16.0-alpine3.16
ENV NODE_ENV=production
COPY auth_certificates /ssl
WORKDIR /app
COPY --from=builder /app/dist .
COPY --from=builder /app/config.yml .
ENTRYPOINT node index.js