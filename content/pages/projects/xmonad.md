---
title: "XMonad"
date: "2026-03-18"
slug: "projects/xmonad"
published: false
layout: "page"
repository: "https://github.com/jpoage1/xmonad"
tags:
  - window managers
  - xmonad
  - haskell
  - tech writing
---

## My Journey Into Functional Perfection

### The Haskell Bait

I’ve always wanted to learn **Haskell**. I’ve tried to follow the standard functional programming advice: avoid mutability, skip classes, keep functions pure, and make them do exactly one thing. But there is a massive gap between reading a manual and actually applying those concepts to a system you use every day.

At the time, I was using **i3**. It worked, but I was looking for something that would actually force me to use the language. That’s when I found **XMonad**.

### The Compiler as a Gatekeeper

The learning curve wasn't a slope; it was a wall. Haskell is stricter than anything I was used to. It introduced me to a vocabulary that felt like an entirely different branch of mathematics.

- _What is a monad?_ \* _Why is my logic correct but my types wrong?_ \* _Why won't the compiler just let me run a "broken" program and let it crash?_

> **Haskell’s answer was always: No.** It demanded absolute perfection. It wouldn’t let the code exist until it was mathematically sound.

### Why i3 Started to Feel "Cheap"

Eventually, I hacked my way through the config until I could recreate everything I had in i3. But once I got there, I realized I couldn't go back.

In i3, if I wanted a custom behavior, I had to use **IPC commands** and external scripts. It felt brittle—like my desktop was held together by glue and shell scripts. **XMonad** was different. Because the config _is_ the source code, I could do anything I could imagine, provided I could satisfy the compiler.

### The Result: A Mathematical Beast

Once an XMonad config compiles, it’s a beast. You gain a level of confidence in your environment that you just don't get with other managers. It isn't going to fail you, it isn't going to stutter, and it isn't going to behave unexpectedly. It is rock-solid—at least until you decide it’s time to move to Wayland.

---

### Technical Highlights

- **Language:** 100% Haskell.
- **Paradigm:** Purely functional window management.
- **Extensibility:** Custom hooks for layout and status bar integration (XMobar).
- **Stability:** Zero crashes once compiled.
