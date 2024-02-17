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

You must run the `build:test` script before running the tests in order to ensure sqlite-wasm is available during tests.

Unfortunately, there's no configuration for separating this from the main build, so it must be undone after testing (currently in an `afterall` hook).

## Build

Run the `build` script.
