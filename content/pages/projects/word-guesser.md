---
title: "The Word Guessing Game"
date: "2026-03-19"
slug: "projects/word-guesser"
published: true
demo_url: "/games/word-guesser"
demo_label: "Play the Game"
layout: "page"
tags:
  - javascript
  - dom manipulation
  - test-driven development
  - class design
---

## Building a Word Guesser

### A Study in Class Architecture and Testing

The "Word Guessing Game" was initially assigned as an introductory project to demonstrate basic DOM manipulation and event handling in JavaScript. However, writing a flat script that mutates global state to update a UI is brittle and difficult to scale.

Instead of writing a standard functional script, I used this assignment to practice and apply my skills **Test-Driven Development (TDD)** and **Object-Oriented Architecture** in JavaScript.

### Decoupling Logic from the DOM

The core design philosophy was strict separation of concerns. The game logic needed to be entirely unaware of the HTML Document Object Model.

I architected a dedicated `WordGuesser` class. This class handles the actual mechanics: maintaining the array of the target word, logging `goodGuesses` and `badGuesses`, tracking the placeholder array (`currentWord`), and calculating the win condition.

By isolating the logic, the `WordGuesser` class became highly testable. It takes inputs and throws specific, structured errors (e.g., `DuplicateBadGuessError`, `InvalidGuessError`). It never touches a `document.getElementById()`.

### Bridging the Gap: The `Game` Class

To handle the interface, I created a higher-level `Game` class. This acts as the controller. It instantiates the `WordGuesser` logic engine and takes a `GameFields` configuration object (which maps the DOM IDs).

When the user submits a guess, the `Game` class passes the input to the `WordGuesser` engine. The engine processes the logic and returns a state or throws an error. The `Game` class catches these errors and translates them into UI updates—specifically, rendering the hostile and sarcastic notification messages.

### Writing a Custom Testing Suite

Because I isolated the `WordGuesser` logic, I could subject it to rigorous testing. Rather than importing a heavy framework like Jest for a single-page school project, I built a custom **TestRunner class** (`content/html/word-guesser/scripts/tests.js`).

The custom testing suite implements a chainable API, mimicking professional frameworks:

```javascript
testWordGuesserLogic
  .expect("accepts a good guess and does not increase the guess count")
  .value(() => {
    wordGuesser.guessLetter(validLetter);
    return wordGuesser.guessCount();
  })
  .toBe(1)
  .assert();
```
