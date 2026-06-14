---
title: "Pipeline Runner"
date: "2026-03-18"
slug: "projects/pipeline_runner"
published: true
layout: "page"
repository: "https://github.com/jpoage1/pipeline_runner"
tags:
  - tech writing
---

## The Accidental Architect: Building a Modular Pipeline Runner

### The Fatigue of Manual Labor

I never intended to write a pipeline runner. Honestly, I thought that’s what Groovy and Jenkins were for. But my project started getting complex: a **C++ core**, a **Python backend**, and a **Svelte frontend**.

Every time I wanted to test a change, I had to:

1. Compile the C++ binaries.
2. Run the unit tests.
3. Trigger Python integration tests.
4. Validate the backend.
5. Boot the backend.
6. Run frontend tests.
7. Finally, start the dev server.

Doing that once is fine. Doing it fifty times a day is soul-crushing.

### The Evolution: Bash to Python to Vertical Limit

I started with a Bash script. It was "fine," until it wasn't. I wanted more control, so I moved the logic to Python. Then I scripted more. Eventually, I hit that wall every dev knows: _Am I actually working on my project, or is the Pipeline Runner my project now?_

There were days I’d just give up on the script and type `gcc` commands manually or rely on my `flake.nix` aliases. The pipeline runner was supposed to be a convenience, but at times, it felt like a second full-time job.

### The Groovy Epiphany

The real shift happened when I started setting up my **Jenkins/Groovy CI/CD pipeline**. Looking at Groovy, I just kept thinking: _"This would be so much easier in Python."_ So, I started over. Again.

I built a second runner from scratch for the CI environment. When I realized I was maintaining two separate scripts doing the same thing, I looked at the new one and realized it was actually superior. I gutted the old logic, merged it with the new modular core, and consolidated everything.

### Where It Stands Now

Today, both of my major projects use this same runner. It’s been fully modularized so it can be dropped into a new repo and customized in minutes.

I’m sure there are enterprise-grade tools out there that do exactly what this does (and probably more), but this wasn't a choice—it was an accident born of necessity. I was just trying to automate my build process, and in the process, I accidentally built a tool I can actually rely on.

---

### Technical Snapshot

- **Core:** Python-based modular execution.
- **Environment:** Integrated with **NixOS (flakes)** for reproducible build dependencies.
- **CI/CD:** Replaces complex Groovy logic with a unified, portable Python script.
- **Capability:** Handles multi-language builds (C++, Python, JS) and orchestrates service dependencies for integration testing.
