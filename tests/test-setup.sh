#!/bin/sh

cd tests/browser

rm -rf tinysynq.module.js
rm -rf sqlite3-bundler-friendly.mjs
rm -rf sqlite3-worker1-bundler-friendly.mjs
rm -rf sqlite3.wasm

ln -s ../../dist/tinysynq.module.js tinysynq.module.js
ln -s ../../node_modules/.pnpm/@sqlite.org+sqlite-wasm@3.45.1-build1/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-bundler-friendly.mjs sqlite3-bundler-friendly.mjs
ln -s ../../node_modules/.pnpm/@sqlite.org+sqlite-wasm@3.45.1-build1/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-worker1-bundler-friendly.mjs sqlite3-worker1-bundler-friendly.mjs
ln -s ../../node_modules/.pnpm/@sqlite.org+sqlite-wasm@3.45.1-build1/node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3.wasm sqlite3.wasm

cd ../../