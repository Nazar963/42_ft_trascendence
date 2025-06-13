# Use the official Node.js Alpine image as the base image
FROM node:alpine

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD [ "/bin/sh", "-c", "npx prisma db push && npm run start" ]
