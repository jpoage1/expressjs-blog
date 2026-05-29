---
title: "Example Blog Post"
date: "2025-05-15"
slug: "example-blog-post"
published: true
layout: "blog-post"
tags:
  - markdown
  - express
  - nodejs
  - blog-engine
  - handlebars
  - xss
  - gray-matter
  - postcss
  - code-highlighting
  - web-development
---

# Welcome to My Blog

This post serves as a fixture to validate Markdown parsing and layout rendering. It's written in standard `.md`, parsed via `marked`, sanitized for XSS, and passed through a custom layout engine using `express-handlebars`.

## Markdown Features

**I chose to use markdown because it's:**

- Easy to write
- Converts to clean HTML
- Supports **bold**, _italic_, and `inline code`

## Engine Details

- Markdown rendered at request time with `gray-matter` + `marked`
- HTML output is sanitized via `xss-clean` middleware
- Layouts are precompiled for performance and cached in memory
- Styling is minimal, composed at build with `postcss-import`

## Code Example

Code blocks are highlighted using native `<pre><code>` tags. Language inference and highlighting are not handled by JavaScript on the client—deliberate decision to avoid runtime bloat.

```js
console.log("Hello, world!");
```
