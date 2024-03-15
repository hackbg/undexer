FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN npm ci
