# Desktop is the installed web app

Status: accepted

The desktop-style client is the web app, installed as a PWA, not a second codebase.

Why: one UI then serves the browser and the desktop window, and the binder motion only has to be built once.

No service worker and no PWA plugin are added in the skeleton. The slice that makes the window installable records the packaging dependency first.
