# --- Build Stage ---
ARG NODE_VERSION=20.20-alpine
FROM node:${NODE_VERSION} as build-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# Pass API URL to build-time (Vite needs this)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine as production-stage

# Install curl for healthcheck consistency across the stack
RUN apk add --no-cache curl

# Copy build output from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for internal traffic
EXPOSE 80

# Healthcheck for nginx
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
