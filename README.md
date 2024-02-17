# synqlite-web

To install dependencies:

```bash
pnpm i
```

To watch:

```bash
pnpm run watch
```

## Test

All tests are under the `./tests` directory, along with a tiny index.html that is served and used as the target for the tests.

Run `npm test` or `npm run test:build`. The latter builds the library before running the tests. There are two possible builds:
- `build:prod`: calls `microbundle`
- `build:full`: calls `microbundle --external none`

The latter is necessary to bundle the `@sqlite.org/sqlite-wasm` package into the library. This ensures that sqlite-wasm is available during tests and allows the DB to load properly.


## Build

Run the `build` script.
