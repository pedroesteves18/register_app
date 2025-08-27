FROM node:18-alpine

# Install PostgreSQL client tools and other utilities
RUN apk add --no-cache \
    postgresql-client \
    tar \
    gzip \
    bash

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create backup directory
RUN mkdir -p /backups

EXPOSE 8001

CMD ["node", "app.js"]
