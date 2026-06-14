# HTML Router — `@jpoage1/base-context`

The `html()` template router serves a self-contained HTML page (with its own assets) through the Express/Handlebars layout system. It reads a `config.yaml` from a content folder, loads the HTML file it describes, and renders it inside the site's standard layout via `renderWithBaseContext`.

---

## When to use it

Use `html()` when you have a page that:

- Has its own CSS and/or JavaScript that shouldn't be bundled with the site
- Is stored as a standalone HTML fragment (not a Handlebars template)
- Lives under a content directory alongside other page content

Examples: the checkout page, the resume, a presentation, a game, an interactive tool.

---

## Directory structure

```
<contentPath>/
  html/
    <contentFolder>/
      config.yaml        ← required
      index.html         ← or whatever file: points to
      src/
        script.js
      css/
        styles.css
```

The router automatically serves everything in `<contentFolder>/` as static assets under `/assets`.

---

## config.yaml

```yaml
title: Checkout # Page <title> and base context title
file: index.html # HTML file to load and inject as {{{content}}}
page:
  page # Optional — handlebars page template, default: "page"
  # resolves to pages/<page>.handlebars

styles: # Optional — list of CSS filenames in the folder
  - css/styles.css # Served from /assets/, injected via extraStyles partial

scripts: # Optional — list of JS filenames
  - src/script.js # Served from /assets/, injected via {{#section "scripts"}}

meta: # Optional — arbitrary key/value passed into template context
  description: "..."
```

### `page` values

| Value          | Template used                   |
| -------------- | ------------------------------- |
| _(omitted)_    | `pages/page.handlebars`         |
| `page`         | `pages/page.handlebars`         |
| `presentation` | `pages/presentation.handlebars` |
| any string     | `pages/<value>.handlebars`      |

---

## Mounting the router

```js
const { html } = require("@jpoage1/base-context");

const { router } = html({
  contentPath: "/srv/projects/jasonpoage.com/finance-frontend",
  routePath: "/checkout",
  contentFolder: "checkout",
});

app.use("/checkout", router);
```

### Parameters

| Parameter       | Type   | Required | Description                                                                                            |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `contentPath`   | string | yes      | Root of the content directory. The router looks for `<contentPath>/html/<contentFolder>/`              |
| `routePath`     | string | yes      | The URL path the router is mounted at. Used to build asset URIs so CSS/JS references resolve correctly |
| `contentFolder` | string | yes      | Subfolder name inside `<contentPath>/html/`                                                            |

All three are required. Missing any one throws a `TypeError` immediately at startup, not at request time.

---

## What the router does

1. Serves `<contentFolder>/` as static files under `/assets`
2. On `GET /`, reads `config.yaml`
3. Reads the HTML file named in `file:`
4. Builds asset URIs: `<baseUrl><routePath>/assets/<filename>`
5. Calls `res.locals.renderWithBaseContext(template, context, cssOverrides)` with:
   - `title` from config
   - `content` — the raw HTML string (rendered as `{{{content}}}` in the template)
   - `extraStyles` — array of fully-qualified CSS URIs
   - `extraScripts` — array of fully-qualified JS URIs
   - `slug` — the `routePath` value
   - `meta` — the meta object from config
   - CSS override: `{ classes: { content: "content" } }`

---

## How assets are referenced in your HTML

Your HTML file is injected as a raw string into `{{{content}}}`. It does **not** get its own `<head>` — that's handled by the Handlebars layout.

Styles declared in `config.yaml` are injected by the `extraStyles` partial into the layout's `<head>`. Scripts are injected via `{{#section "scripts"}}` before `</body>`.

Inside your HTML file, link to your own assets using **relative paths**:

```html
<!-- These will NOT work — the base URL is unknown at authoring time -->
<img src="/checkout/assets/logo.png" />

<!-- These WILL work — relative to the page URL -->
<img src="assets/logo.png" />
```

Or inject the base URL dynamically from the context if you need it in JS:

```html
<script>
  window.__baseUrl = "{{baseUrl}}"; <!-- only works in .handlebars, not in .html fragments -->
</script>
```

For pure HTML fragments use `data-*` attributes on a container element and read them in JS (the `hydrate()` pattern from `@jpoage1/forms/client`).

---

## Current checkout setup

```
/srv/projects/jasonpoage.com/finance-frontend/
  html/
    checkout/
      config.yaml
      index.html
      confirmation.html
      order.html
      css/
        styles.css
      src/
        customerInfo.js
        orderInfo.js
        script.js
        shared.js
        validators.js
        testData.js
```

Mount:

```js
const { router } = html({
  contentPath: "/srv/projects/jasonpoage.com/finance-frontend",
  routePath: "/checkout",
  contentFolder: "checkout",
});

app.use("/checkout", router);
```

`config.yaml` for the checkout page:

```yaml
title: Get Started
file: index.html
page: page
styles:
  - css/styles.css
scripts:
  - src/validators.js
  - src/shared.js
  - src/customerInfo.js
  - src/orderInfo.js
  - src/script.js
```

---

## Gotchas

**Script order matters.** Scripts are injected in the order listed in `config.yaml`. `validators.js` and `shared.js` must come before the files that depend on them.

**The `/assets` route is mounted at the router level**, not the app level. If the router is mounted at `/checkout`, assets are at `/checkout/assets/`. The `routePath` parameter must match the `app.use()` mount path exactly or asset URIs will be wrong.

**`contentFolder` is a subfolder of `html/` inside `contentPath`.** The full resolved path is `<contentPath>/html/<contentFolder>/`. If the folder doesn't exist the error surfaces at request time (when `config.yaml` fails to read), not at startup.

**`config.yaml` is re-read on every request.** No caching. This is intentional — you can edit the config without restarting the server. In production this is fine; the file is tiny and the OS caches it.

**The HTML file is a fragment, not a full document.** Don't include `<html>`, `<head>`, or `<body>` tags. The Handlebars layout provides those. If you paste a full HTML document in, it will render double `<html>` tags.

---

# Page Routing — expressjs-blog

Routes are declared as config objects in `content/routes/getRoutes.js` and
processed automatically by `src/routes/pages.js`. You never call the route
classes directly.

---

## Route types

There are four arrays you can populate in the manifest returned by `getRoutes.js`:

```js
return {
  constructionRoutes: [...],  // "coming soon" placeholder pages
  markdownRoutes:     [...],  // pages rendered from .md files
  htmlRoutes:         [...],  // self-contained HTML pages with their own assets
  projects:           [...],  // markdown pages with project: true context
};
```

---

## HTML routes

Use for pages that have their own CSS and JavaScript — interactive tools,
games, the checkout page, etc.

### Declaration

In `getRoutes.js`:

```js
htmlRoutes: [
  { path: "/games/word-guesser", contentFolder: "word-guesser" },
  { path: "/checkout",           contentFolder: "checkout"     },
],
```

| Key             | Description                                  |
| --------------- | -------------------------------------------- |
| `path`          | URL the page is served at                    |
| `contentFolder` | Subfolder name inside `<meta.content>/html/` |

### Directory structure

```
<meta.content>/
  html/
    checkout/
      config.yaml       ← required
      index.html        ← or whatever file: points to
      css/
        styles.css
      src/
        validators.js
        script.js
```

### config.yaml

```yaml
title: Get Started # Page title
file: index.html # HTML fragment to load — re-read on every request
page:
  page # Handlebars template: pages/<page>.handlebars
  # Default: "page"

styles: # Must be present even if empty: []
  - css/styles.css

scripts: # Must be present even if empty: []
  - src/validators.js
  - src/shared.js
  - src/customerInfo.js
  - src/script.js

meta: {} # Optional — passed into template context as-is
```

**Script order matters.** Scripts are injected in the order listed.
Put dependencies before the files that use them.

**`styles` and `scripts` must be present.** If either key is missing
the route throws on registration because `undefined.map()` will error.
Use an empty array `[]` if you have nothing to list.

### How assets are resolved

Assets are served statically from the content folder at `<path>/assets/`.

```
/checkout/assets/css/styles.css
/checkout/assets/src/script.js
```

The URI is built as `res.locals.baseUrl + routePath + "/assets/" + filename`.
The `path` in the route declaration must match the `app.use()` mount path
exactly or asset URIs will be wrong.

### Caching

In production (`NODE_ENV=production`) the full render context — template,
context object, and CSS overrides — is cached in memory after the first
request. The HTML file is not re-read until the server restarts.

In development, the HTML file is re-read on every request. You can edit
it without restarting the server.

`config.yaml` is always read once at registration time (server startup),
not per-request.

### What the HTML file should contain

The file is a **fragment**, not a full document. No `<html>`, `<head>`,
or `<body>` tags. The Handlebars layout provides those.

Your styles and scripts are injected by the layout via `extraStyles` and
`extraScripts` — you don't need `<link>` or `<script>` tags in the fragment.

```html
<!-- index.html — just the content -->
<div id="checkout-container">
  <div id="step-intro" class="checkout-section active">...</div>
</div>
```

---

## Markdown routes

For content pages written in Markdown with optional frontmatter.

```js
markdownRoutes: [
  { path: "/tools",    file: "tools"    },
  { path: "/about/me", file: "about-me" },
],
```

| Key    | Description                                           |
| ------ | ----------------------------------------------------- |
| `path` | URL the page is served at                             |
| `file` | Filename without extension in `<meta.content>/pages/` |

---

## Project pages

Same as markdown routes but with `project: true` injected into context.
Used for individual project write-ups.

```js
projects: [
  { path: "/projects/lisp-interpreter", file: "projects/lisp_interpreter" },
  { path: "/projects/word-guesser",     file: "projects/word-guesser"     },
],
```

---

## Construction routes

Renders a "coming soon" placeholder using the construction template.

```js
constructionRoutes: [
  { path: "/changelog", title: "Changelog" },
  { path: "/archive",   title: "Archive"   },
],
```

---

## Current checkout setup

```js
// content/routes/getRoutes.js
htmlRoutes: [
  { path: "/checkout", contentFolder: "checkout" },
],
```

```
finance-frontend/
  html/
    checkout/
      config.yaml
      index.html
      css/
        styles.css
      src/
        validators.js
        shared.js
        customerInfo.js
        orderInfo.js
        script.js
```

```yaml
# config.yaml
title: Get Started
file: index.html
page: page
styles:
  - css/styles.css
scripts:
  - src/validators.js
  - src/shared.js
  - src/customerInfo.js
  - src/orderInfo.js
  - src/script.js
meta: {}
```

---

## Gotchas

**`styles` and `scripts` must be arrays.** Missing either key causes a
`TypeError` at server startup when the route is registered, not at
request time.

**`config.yaml` is read once at startup.** Editing it requires a server
restart. The HTML file itself is re-read per request in development.

**`contentFolder` path.** Resolves to `<meta.content>/html/<contentFolder>/`.
If the folder doesn't exist the error surfaces at startup when `config.yaml`
fails to read.

**Assets path must match mount path.** The assets URI is built from the
`path` value in your route declaration. If your route is at `/checkout`
but mounted differently upstream, assets will 404.
