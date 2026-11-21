# Web is React, TypeScript, and Vite

Status: accepted

The web client is React 19.3.1 and TypeScript 6.0.3, bundled with Vite 8.3.8. Vitest 5.1.1 runs tests. ESLint 10.15.0, typescript-eslint 8.73.0, and Prettier 3.10.1 are the lint and format checks.

Why: furbo-papa's web UI is already React, and Vite is the ordinary bundler for a typed React app that can later be installed.

TypeScript stays on 6.0.3 because typescript-eslint 8.73.0 does not accept TypeScript 7, and the skeleton's CI lints with that plugin.

The page mounts an empty root. No screen, no router, and no PWA plugin yet. Packaging is [0006](0006-desktop-is-the-installed-web-app.md).
