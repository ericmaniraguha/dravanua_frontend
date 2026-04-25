# Build stage
ARG NODE_VERSION=20.20-alpine
FROM node:${NODE_VERSION} as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Run build
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy build files from build-stage to nginx public directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed, otherwise use default
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
