FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN pnpm i --frozen-lockfile
