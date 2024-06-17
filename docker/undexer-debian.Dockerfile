FROM rust:1.77-slim-buster
WORKDIR /app
RUN apt update && \
  apt install -y build-essential protobuf-compiler nodejs npm curl && \
  ls -al /var/cache/apt/archives && \
  apt-get clean
RUN npm i -g n && \
  n i 20 && \
  corepack enable
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack
ADD ./rust/ ./rust
RUN pwd && ls -al
RUN cd rust && ~/.cargo/bin/wasm-pack build --dev --target nodejs
ADD . ./
RUN pwd && ls -al
RUN pnpm i --frozen-lockfile
