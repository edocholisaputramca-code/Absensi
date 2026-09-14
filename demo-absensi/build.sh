#!/usr/bin/env bash
# Menyusun ulang index.html & dev.html dari folder src/
cd "$(dirname "$0")" || exit 1
node build.js
