#!/bin/sh
set -ex
find . -type d -name node_modules -prune -o -name 'package.json' -print
