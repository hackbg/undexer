FROM node:21-slim
WORKDIR /app
ADD . ./
RUN apt update && apt install -y rustup build-essential
RUN rustup-init -y -t wasm32-unknown-unknown
RUN ~/.cargo/bin/cargo install wasm-pack
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm buildRust
