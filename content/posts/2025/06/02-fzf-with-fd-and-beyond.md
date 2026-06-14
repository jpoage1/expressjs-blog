---
title: "fzf with fd—and Beyond"
date: "2025-06-02"
slug: "fzf-with-fd-and-beyond"
published: true
layout: "blog-post"
tags:
  - fzf
  - fd
  - command-line
  - linux
  - productivity
  - shell
  - unix
  - tools
---

# Why You Might Use [`fzf`](https://github.com/junegunn/fzf) with [`fd`](https://github.com/sharkdp/fd)—and Beyond

At first glance, `fzf` looks like a simple [fuzzy finder](https://en.wikipedia.org/wiki/Fuzzy_string_matching) for your terminal. You type part of a string, and it finds the best matches in a list. That alone is powerful—but not enough. To use `fzf` effectively, you need to feed it good data. That’s where tools like `fd` come in.

## The Role of [`fd`](https://github.com/sharkdp/fd): Clean Input for Better Output

[`fd`](https://github.com/sharkdp/fd) is a modern replacement for [`find`](https://man7.org/linux/man-pages/man1/find.1.html). It's faster, more intuitive, and designed to work well with other [command-line tools](https://en.wikipedia.org/wiki/Command-line_interface). While `fzf` handles fuzzy selection, `fd` generates the list of items you can select from. This separation of concerns is critical.

Compare:

```bash
fzf
```

This opens `fzf` with no input. It waits for something to search. You can type, but it does nothing useful.

Now:

```bash
fd . | fzf
```

`fd` recursively lists all files from the current directory. `fzf` then allows you to quickly pick the one you want. Together, they create an interactive file navigation system that’s faster and more flexible than a [GUI](https://en.wikipedia.org/wiki/Graphical_user_interface).

## Real World: Beyond File Navigation

The power of `fzf` extends far beyond picking files:

### 1. **[Git](https://git-scm.com/) Workflow Enhancement**

```bash
git checkout $(git branch | fzf)
```

Quickly switch branches without remembering exact names.

### 2. **Command History Search**

```bash
history | fzf
```

Find a previously used command without paging through history.

### 3. **Process Management**

```bash
ps aux | fzf | awk '{print $2}' | xargs kill
```

Fuzzy-select a process to kill without manually finding the [PID](https://en.wikipedia.org/wiki/Process_identifier).

### 4. **[SSH](https://en.wikipedia.org/wiki/Secure_Shell) Host Selection**

```bash
cat ~/.ssh/known_hosts | cut -d',' -f1 | fzf | xargs ssh
```

Choose a remote host to connect to from your known SSH entries.

### 5. **Running Scripts**

```bash
ls ~/scripts | fzf | xargs -I{} bash ~/scripts/{}
```

Select a script to execute from a collection.

### 6. **[Systemd](https://freedesktop.org/wiki/Software/systemd/) Service Control**

```bash
systemctl list-units --type=service --all | fzf | awk '{print $1}' | xargs systemctl restart
```

Interactively restart a systemd service.

## Why Pairing Matters

`fzf` alone is an interface. What makes it useful is your data source. The better your source list, the more powerful your workflow. `fd`, `git`, `ps`, `ls`, `systemctl`, and even `cat` can be used as upstream providers to create dynamic, contextual interfaces with minimal overhead.

Use `fzf` as a control mechanism: a selector for lists you define. Then pipe the output into whatever action you want to take.

## Summary

- [`fzf`](https://github.com/junegunn/fzf) is a universal interface for selecting from a list.
- [`fd`](https://github.com/sharkdp/fd) is a fast, modern file generator—perfect as input to `fzf`.
- The pairing allows efficient, focused file management.
- Outside of files, `fzf` improves speed, clarity, and precision in virtually every shell task involving lists.

If you ever find yourself repeating `grep` or `cat` into `awk` to get a list just to copy and paste something—consider using `fzf` instead.

> **Link Disclosure**
>
> All links are primary source or canonical definition:
>
> - GitHub repos for `fzf` and `fd`
> - Linux man pages or Wikipedia for commands and core concepts
> - Freedesktop for `systemd`
>
> No promotional, no affiliate, no commercial links.  
> No content added, removed, or softened.
