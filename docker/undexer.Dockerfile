FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN apk update && apk add rustup
RUN rustup-init -y -t wasm32-unknown-unknown
RUN ~/.cargo/bin/cargo install wasm-pack
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm buildRust
