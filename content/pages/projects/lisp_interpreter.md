---
title: "Lisp Interpereter"
date: "2026-03-18"
slug: "projects/xmonad"
published: true
layout: "page"
repository: "https://github.com/jpoage1/lisp_interpreter"
tags:
  - lisp
  - interpereters
  - tech writing
---

## Building a Jet Engine in the Dark

### The State of Ignorance

When I started this, I was operating in total darkness. I didn't know what a **tokenizer** was. I had no concept of a **lexer**. I didn't understand how compilers transformed text into logic, and my only exposure to **Assembly** was looking at it and thinking, _"That looks too primitive; I’ll stick to the high-level stuff."_

Then someone gave me the most intimidating advice possible: _"You should try writing your own programming language."_

### Breaking the Magic

The breakdown was simple enough: stop looking at the whole language and start parsing one character at a time. No **Regex**, no shortcuts. Just raw strings and logic. I found a guide that walked me through building a Lisp from scratch in **C**, and I dove in.

To be honest, I spent most of the project in a state of "blind trust." I understood the individual lines of code I was writing, but I was relying entirely on the author's instructions. I felt like I was building a jet engine for the first time—assembling complex components and hoping that when I hit "run," it wouldn't explode. It was intimidating to realize I was now the one in charge of the syntax rules.

### The Refactor That Killed the Beast

I eventually finished the tutorial and had a working interpreter. Naturally, I wanted to expand it. The problem was that the tutorial left me with one massive, monolithic file. I decided to refactor it into smaller, modular components.

This is where it fell apart. At the time:

- I had never written **C** before this project.
- I was still trying to figure out how **Git** actually worked.
- I started breaking things without understanding _why_ they were breaking.

I managed to commit a version that "worked" (or so I remember), but the logic eventually became a black box to me. I lost the thread of how the components talked to each other.

### Project Status: Dead (For Now)

This project is officially dead. I don't know how it works anymore, and the code is a relic of a time before I understood memory management or proper version control. But it served its purpose: it stripped away the mystery of how a language functions. I’ll leave it in the archives until the day I decide I need my own Lisp again.

---

### Technical Retrospective

- **Language:** C (My first real exposure to the language).
- **Lessons Learned:** Recursive descent parsing, pointer arithmetic, and why you should learn Git _before_ a major refactor.
- **Architecture:** Hand-rolled tokenizer and a basic REPL loop.
