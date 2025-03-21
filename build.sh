#!/bin/sh
set -ex
apk add --no-cache buildah fuse-overlayfs netavark iptables
export DISTRO="$1"
export VERSION="$(date -u +%Y%m%d%H%M%S).0.0-$(echo $DRONE_COMMIT_SHA|head -c8)-$DRONE_BUILD_NUMBER"
export IMAGE="$OCI_HOST/$OCI_NAME-$DISTRO"
export TAGGED="$IMAGE:$VERSION"
printf "Name: $IMAGE\nImage: $TAGGED\n"
echo "$OCI_PASS" | buildah login -u "$OCI_USER" \
  --password-stdin \
  "https://$OCI_HOST"
buildah build --layers --cache-from="$IMAGE" --cache-to="$IMAGE" \
  --network=host \
  -f Dockerfile \
  --target=prod \
  -t "$IMAGE" \
  .
buildah push "$IMAGE"
