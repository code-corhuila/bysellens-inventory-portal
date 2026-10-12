FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN --mount=type=secret,id=npm_ca \
    NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca CYPRESS_INSTALL_BINARY=0 npm ci --no-audit --no-fund
COPY . .
ARG DATA_MODE=mock
ARG API_BASE_URL=http://localhost:8080
ENV VITE_DATA_MODE=$DATA_MODE VITE_API_BASE_URL=$API_BASE_URL
RUN npm run test.unit && npm run build
FROM nginx:1.28-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html/mfe/inventory
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
