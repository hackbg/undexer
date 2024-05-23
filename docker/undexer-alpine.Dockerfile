FROM rust:1.77-alpine3.18@sha256:4c640cb99e88d7e7873a25e5dc693999cd4c5a0f486b54362513f80107920ac3 as wasm
RUN apk add musl-dev protoc protobuf-dev openssl-dev
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack
WORKDIR /build
ADD ./rust/ .
RUN PATH=$PATH:~/.cargo/bin wasm-pack build --dev --target nodejs && rm -rf target

FROM node:21-alpine@sha256:6d0f18a1c67dc218c4af50c21256616286a53c09e500fadf025b6d342e1c90ae
RUN apk add git
WORKDIR /app
ADD . ./
RUN pwd && ls -al
RUN git submodule update --init --recursive && rm -rf .git
RUN corepack enable && pnpm i --frozen-lockfile
COPY --from=wasm /build/pkg ./rust/pkg
RUN pwd && ls -al && ls -al rust/
