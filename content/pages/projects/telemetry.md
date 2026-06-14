---
title: "C++ Telemetry Poller"
date: "2026-03-18"
slug: "projects/telemetry"
published: true
layout: "page"
repository: "https://github.com/jpoage1/telemetry"
tags:
  - telemetry
  - conky
  - custom engine
  - tech writing
---

## From Bash Hacks to System Monitoring

### The Problem: Silent Disk Failures

It started with a simple, silent failure. My Raspberry Pi server ran out of disk space, and I had no idea. I wasn't monitoring it, and while I could have just SSH’d in and ran `df -h` or `top` every hour, that's not how an engineer solves a problem.

At the time, my go-to for desktop metrics was **Conky**. I had a basic **Bash** script that would use an **SSH** command to poll the Pi, and Conky would display that on my laptop. It worked, but it felt fragile.

### The Pivot: Learning C++ Through Necessity

I was about to start a C++ class in college and wanted to get ahead of the curve. Reading a file in C++ and printing it to the console seemed like a "level one" task, so I decided to rebuild my monitoring tool from scratch.

What started as a disk monitor soon became my preferred tool. It was faster and more consistent than my old scripts. Soon, I was using the same C++ logic to generate **Conky strings** for both my laptop and my server. It was stable, it was mine, and it helped me ace that semester.

### The Wayland Roadblock

Then came the migration to **Wayland**. Conky is a staple of the Xorg world, but running it in Wayland usually requires "backdoors" like XWayland. I didn't see the point in moving to a modern display protocol if I was just going to keep Xorg dragging along in the background for a clock and a disk meter.

I needed a change. By this point, the core C++ telemetry engine was solid, but I needed it to speak a different language. I shifted the output from Conky strings to **JSON** so it could be consumed by **Eww (ElKowar's Wacky Widgets)** using **Yuck**.

### The Network "Cheat Code"

The final challenge was remote monitoring. I considered writing a full-blown socket server in C++, but honestly? I wanted it to work _now_.

I spun up a functional **Python** server in about five minutes. It takes the JSON output from my C++ poller and broadcasts it over my local network. Now, my **Eww widgets** can remotely monitor the Raspberry Pi from any machine in the house.

> "It took me nearly the entire semester to finish the C++ logic, but only five minutes to serve it over the network. It felt like I was cheating, but it worked."

---

### Implementation Notes

- **Source Code:** The core telemetry poller is available in the repo.
- **Environment:** Built for **NixOS** and **Debian**, but should run anywhere with a C++ compiler.
- **The "Glue":** I haven't included the Python server or the specific Eww/Yuck configs here (they live in a seperate repo), but if you're comfortable with networking and widgets, you can probably see how the pieces fit together.
