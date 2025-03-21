# Build the WASM blob
from oci.hack.bg/platform-alpine:latest as wasm
  run mkdir -p /home/hack/build/fadroma-namada
  workdir /home/hack/build/fadroma-namada
  copy ./fadroma/packages/namada/Cargo.toml ./fadroma/packages/namada/Cargo.lock .
  run ls -al \
   && cat Cargo.toml \
   && mkdir -p src \
   && touch src/lib.rs \
   && PATH=$PATH:~/.cargo/bin cargo fetch
  copy ./fadroma/packages/namada/src ./src
  run PATH=$PATH:~/.cargo/bin \
   wasm-pack build --release --target web -- --verbose \
   && rm -rf target

# Build the app container
from oci.hack.bg/runtime-debian:latest as prod
  user 0
  run useradd -mu1000 undexer
  run mkdir -p /app
  workdir /app
  # See https://github.com/nodejs/corepack/issues/612#issuecomment-2631462297
  env COREPACK_INTEGRITY_KEYS='{"npm":[{"expires":"2025-01-29T00:00:00.000Z","keyid":"SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA","keytype":"ecdsa-sha2-nistp256","scheme":"ecdsa-sha2-nistp256","key":"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg=="},{"expires":null,"keyid":"SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U","keytype":"ecdsa-sha2-nistp256","scheme":"ecdsa-sha2-nistp256","key":"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEY6Ya7W++7aUPzvMTrezH6Ycx3c+HOKYCcNGybJZSCJq/fd7Qa8uuAKtdIkUQtQiEKERhAmE5lMMJhP8OkDOa2g=="}]}'

  add package.json pnpm-lock.yaml .
  run ls -al && pnpm --version && corepack install && pnpm --version #&& corepack up && pnpm --version
  run pnpm fetch -P --stream
  add . ./
  run pnpm -r i -P --frozen-lockfile
  run pwd && ls -al
  copy --from=wasm /home/hack/build/fadroma-namada/pkg/fadroma_namada_bg.wasm ./fadroma/packages/namada/pkg/fadroma_namada_bg.wasm
  run chown -R 1000 /app
  user 1000
  run pwd && ls -al
