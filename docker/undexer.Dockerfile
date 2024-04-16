FROM node:21-alpine
WORKDIR /app
ADD . ./
RUN apk update && apk add rustup
RUN rustup-init -y -t wasm32-unknown-unknown && cat ~/.cargo/env && cat ~/.cargo/env >> /etc/profile
RUN cargo install wasm-pack
RUN corepack enable && pnpm i --frozen-lockfile
RUN pnpm buildRust
