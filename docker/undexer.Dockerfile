FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN corepack enable && pnpm i --frozen-lockfile
