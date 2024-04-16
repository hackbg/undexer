FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN apk update && apk add rustup
RUN rustup default stable && rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm buildRust
