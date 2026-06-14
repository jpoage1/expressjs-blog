function WordGuesserTests(wordChoices, fields) {
  const reporter = new DOMReporter("test_container");
  class TestRunner {
    constructor(appName) {
      this.root = new TestSuite(appName);
    }

    // Proxy to the root suite
    expect(expectation) {
      return this.root.expect(expectation);
    }

    describe(name) {
      return this.root.describe(name);
    }

    report() {
      console.debug("=".repeat(30));
      this.root.report();
      const stats = this.root.getStats();
      console.debug("=".repeat(30));
      console.debug(
        `FINAL REPORT: ${stats.passed}/${stats.total} tests passed.`,
      );
      reporter.render(this.root);
      reporter.renderFinalStats(stats);
      reset(fields);
    }
  }
  class TestSuite {
    constructor(name) {
      this.name = name;
      this.tests = [];
      this.subSuites = [];
    }
    // Create a new test within this suite
    expect(expectation) {
      const test = new Test(this.name).expect(expectation);
      this.tests.push(test);
      return test; // Returns the Test instance for further chaining (.value, .toBe, etc.)
    }
    // Create and return a nested suite
    describe(name) {
      const subSuite = new TestSuite(name);
      this.subSuites.push(subSuite);
      return subSuite;
    }
    // Recursive reporting
    report(depth = 0) {
      const indent = "  ".repeat(depth);

      this.tests.forEach((t) => {
        const status = t.isPassed ? "✅" : "❌";
        console.debug(`${indent}  ${status} ${t.expectation}`);

        if (!t.isPassed) {
          let expected, got;

          if (t.assertionType === "exception") {
            expected = "Error satisfying validation logic";
            got = t.actualResult;
          } else {
            expected = JSON.stringify(t.trialValue);
            got = JSON.stringify(t.actualResult);
          }

          console.error(`${indent}      Expected: ${expected} | Got: ${got}`);
        }
      });

      this.subSuites.forEach((s) => s.report(depth + 1));
    }
    // Helper to aggregate total counts
    getStats() {
      let passed = this.tests.filter((t) => t.isPassed).length;
      let total = this.tests.length;

      this.subSuites.forEach((s) => {
        const stats = s.getStats();
        passed += stats.passed;
        total += stats.total;
      });

      return { passed, total };
    }
  }
  class Test {
    constructor(name) {
      this.name = name;
      this.expectation = null;
      this.sample = null;
      this.trialValue = null;
      this.actualResult = null;
      this.isPassed = false;
      this.errorCaught = null;

      // -- Has been called?
      this._trialValue = false;
      this._sample = false;
      this._callback = null;
      this._threwError = null;
      this._actualResult = null;
    }

    // Define the description of the test
    expect(expectation) {
      this.expectation = expectation;
      return this;
    }

    // The value or function being tested
    value(sample) {
      this._sample = true;
      this.sample = sample;
      return this;
    }

    // The value to compare the result against
    toBe(value) {
      this._trialValue = true;
      this.trialValue = value;
      return this;
    }

    toThrow(validator) {
      this._actualResult = true;
      try {
        if (typeof this.sample === "function") {
          this.sample();
        }
      } catch (e) {
        this.errorCaught = e;
        this.isPassed = validator(e);
        this.actualResult = e;
        this._actualResult = true;
        return this;
      }

      // If no error was thrown, the test fails
      this.isPassed = false;
      this.actualResult = "No error was thrown";
      return this;
    }
    assert(callback) {
      if (this._actualResult !== null) {
        return this;
      }
      try {
        if (typeof this.sample == "function") {
          this.sample = this.sample();
        }
        if (typeof callback === "function") {
          try {
            this.actualResult = callback(this.sample);
          } catch (e) {
            this.threwError = false;
            this.actualResult = e.message;
          }
          this._callback = true;
        } else {
          this.actualResult = this.sample;
          this._callback = false;
        }

        this.isPassed =
          JSON.stringify(this.actualResult) === JSON.stringify(this.trialValue);
      } catch (e) {
        this.actualResult = `Test Engine Error: ${e.message}`;
        this.isPassed = false;
      }
      return this;
    }
    _reportFailure() {
      console.error(
        `Test Suite: ${this.name}\n`,
        "Assertion Failed: ",
        this.expectation,
        "\n" + "Sample Input:   ",
        this.sample,
        "\n" + "Expected Value: ",
        this.trialValue,
        "\n" + "Actual Result:  ",
        this.actualResult,
        "\n",
      );
    }
    reportFailure() {
      console.error(
        `Test Suite: ${this.name}\n`,
        "Assertion Failed: ",
        JSON.stringify(this.expectation),
        "\n" + "Sample Input:   ",
        JSON.stringify(this.sample),
        "\n" + "Expected Value: ",
        JSON.stringify(this.trialValue),
        "\n" + "Actual Result:  ",
        JSON.stringify(this.actualResult),
        "\n",
      );
    }
  }
  let testNumber = 0;
  function tests(word) {
    testNumber++;
    reset(fields);
    const test = new TestRunner(`Word Guesser App Test ${testNumber}`);
    const wordGuesser = new WordGuesser([word]);
    const game = new Game([word], fields);

    const validLetter = word[0];
    const invalidLetter =
      "abcdefghijklmnopqrstuvwxyz".split("").find((c) => !word.includes(c)) ||
      "z";

    // -- Test charsAt(char, chars)
    const testCharsAt = test.describe("charsAt(char, chars)");

    testCharsAt
      .expect("No characters should be found")
      .value({ char: "a", list: ["b", "c"] })
      .toBe(false)
      .assert((input) => charsAt(input.char, input.list));

    testCharsAt
      .expect("One character should be found at index 1")
      .value({ char: "a", list: ["b", "a", "c"] })
      .toBe([1])
      .assert((input) => charsAt(input.char, input.list));

    testCharsAt
      .expect("Two characters should be found at indices 1 and 3")
      .value({ char: "a", list: ["b", "a", "c", "a", "d"] })
      .toBe([1, 3])
      .assert((input) => charsAt(input.char, input.list));

    // -- Test charInChars(char, chars)
    const testCharInChars = test.describe("charsInChars(char, chars)");

    testCharInChars
      .expect("No characters should be found")
      .value({ char: "a", list: ["b", "c"] })
      .toBe(false)
      .assert((input) => charInChars(input.char, input.list));

    testCharInChars
      .expect("One character should be found at index 1")
      .value({ char: "a", list: ["b", "a", "c"] })
      .toBe(true)
      .assert((input) => charInChars(input.char, input.list));

    testCharInChars
      .expect("Two characters should be found at indices 1 and 3")
      .value({ char: "a", list: ["b", "a", "c", "a", "d"] })
      .toBe(true)
      .assert((input) => charInChars(input.char, input.list));

    const testWordGuesserLogic = test.describe("WordGuesser Class");
    testWordGuesserLogic
      .expect("gameOver should return false")
      .value(() => wordGuesser.gameOver())
      .toBe(false)
      .assert();
    testWordGuesserLogic
      .expect("Current word to be placeholders")
      .value(() => wordGuesser.getCurrentWord())
      .toBe(Array(wordGuesser.getActualWord().length).fill("_"))
      .assert();
    testWordGuesserLogic
      .expect("actual word to be " + word + " char list")
      .value(() => wordGuesser.getActualWord())
      .toBe(word.split(""))
      .assert();
    testWordGuesserLogic
      .expect("actual word to be " + word)
      .value(() => wordGuesser.getActualWord().join(""))
      .toBe(word)
      .assert();
    testWordGuesserLogic
      .expect("guesses")
      .value(() => wordGuesser.guessCount())
      .toBe(0)
      .assert();
    testWordGuesserLogic
      .expect("to reject a bad guess")
      .value(() => wordGuesser.guessLetter(invalidLetter))
      .toThrow((err) => err instanceof BadGuessError);
    testWordGuesserLogic
      .expect("count bad guesses")
      .value(() => wordGuesser.guessCount())
      .toBe(1)
      .assert();
    const duplicateGuessError = (err) => {
      return (
        err instanceof Error && err.message.includes("already been guessed")
      );
    };
    testWordGuesserLogic
      .expect("ignore duplicate bad guesses")
      .value(() => wordGuesser.guessLetter(invalidLetter))
      .toThrow(duplicateGuessError);
    testWordGuesserLogic
      .expect("accepts a good guess and does not increase the guess count")
      .value(() => {
        try {
          wordGuesser.guessLetter(validLetter);
        } finally {
          return wordGuesser.guessCount();
        }
      })
      .toBe(1)
      .assert();
    testWordGuesserLogic
      .expect("rejects duplicate good guesses")
      .value(() => wordGuesser.guessLetter(validLetter))
      .toThrow(duplicateGuessError);

    testWordGuesserLogic
      .expect("Updates current word")
      .value(() => {
        return wordGuesser.getCurrentWord()[0];
      })
      .toBe(validLetter)
      .assert();
    testWordGuesserLogic
      .expect("Updates current word")
      .value(() => {
        return wordGuesser.getCurrentWord()[0];
      })
      .toBe(validLetter)
      .assert();

    const testLetter = (letter) => {
      if (
        !word.includes(letter) ||
        wordGuesser.getCurrentWord().includes(letter)
      )
        return true;

      const expectedCount = word.split("").filter((c) => c === letter).length;
      const indexes = wordGuesser.guessLetter(letter);

      if (indexes.length != expectedCount) throw new Error("Length mismatch");
      if (
        charsAt(letter, wordGuesser.getCurrentWord()).length !== expectedCount
      )
        throw new Error("Current word is not updated");
      if (charsAt(letter, wordGuesser.getGuesses()) !== false)
        throw new Error(`Guesses for '${letter}' are not false`);
      return true;
    };

    const unGuessedLetters = [...new Set(word.split(""))].filter(
      (c) => c !== validLetter,
    );
    const l1 = unGuessedLetters.length > 0 ? unGuessedLetters[0] : validLetter;
    const l2 = unGuessedLetters.length > 1 ? unGuessedLetters[1] : l1;

    testWordGuesserLogic
      .expect(`Handles the letter '${l1}'`)
      .value(() => testLetter(l1))
      .toBe(true)
      .assert();
    testWordGuesserLogic
      .expect(`Handles the letter '${l2}'`)
      .value(() => testLetter(l2))
      .toBe(true)
      .assert();
    testWordGuesserLogic
      .expect("Handles game over")
      .value(() => {
        const testGame = new WordGuesser([word]);
        const uniqueChars = [...new Set(word.split(""))];
        uniqueChars.forEach((c) => testGame.guessLetter(c));
        return testGame.gameOver();
      })
      .toBe(true)
      .assert();
    testWordGuesserLogic
      .expect("Handles all guesses")
      .value(() => {
        const testGame = new WordGuesser([word]);
        let validGuesses = [];
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        alphabet.split("").forEach((guess) => {
          validGuesses.push(guess.toLowerCase());
          validGuesses.push(guess.toUpperCase());
        });

        const goodGuesses = validGuesses.filter(
          (badGuess) =>
            charInChars(badGuess, testGame.getActualWord()) !== false,
        );
        const badGuesses = validGuesses.filter(
          (badGuess) =>
            charInChars(badGuess, testGame.getActualWord()) === false,
        );
        const failedBadGuesses = badGuesses.filter((badGuess) => {
          try {
            if (testGame.guessLetter(badGuess) !== false) return true;
          } catch (e) {
            if (
              !(e instanceof BadGuessError) &&
              !(e instanceof InvalidGuessError)
            )
              return true;
          }
        });
        const failedGoodGuesses = goodGuesses.filter((goodGuess) => {
          try {
            testGame.guessLetter(goodGuess);
          } catch (e) {
            return true;
          }
        });
        return failedGoodGuesses.concat(failedBadGuesses);
      })
      .toBe([])
      .assert();
    const testValidation = test.describe("Validation");
    testValidation
      .expect("to handle bad input")
      .value(() => {
        const badInput = "-0123456789!@#$%^&*()[]+=\\|/?,.{}\"'><:;".split("");
        return badInput.filter((input) => {
          try {
            wordGuesser.guessLetter(input);
            return true;
          } catch (e) {
            return false;
          }
        });
      })
      .toBe([])
      .assert();

    const testWordGuesserDOM = test.describe("DOM testing");
    // Test for Button Element
    testWordGuesserDOM
      .expect("Field 'guess_button' should be an HTML Button Element")
      .value(
        fields.guessButton instanceof HTMLButtonElement ||
          fields.guessButton?.type === "button",
      )
      .toBe(true)
      .assert();
    // -- Test the letter input
    testWordGuesserDOM
      .expect("Field 'guess_count' should be an input of type 'number'")
      .value(
        fields.guessCount instanceof HTMLInputElement &&
          fields.guessCount.type === "number",
      )
      .toBe(true)
      .assert();
    testWordGuesserDOM
      .expect("Field 'guess' should be an input of type 'text'")
      .value(
        fields.guessLetter instanceof HTMLInputElement &&
          fields.guessLetter.type === "text",
      )
      .toBe(true)
      .assert();

    // Test for Generic DOM Elements (Paragraphs/Divs)
    testWordGuesserDOM
      .expect("Field 'currentWord' should be a valid DOM element")
      .value(fields.currentWord instanceof HTMLElement)
      .toBe(true)
      .assert();

    testWordGuesserDOM
      .expect("Field 'guesses' should be a valid DOM element")
      .value(fields.guesses instanceof HTMLElement)
      .toBe(true)
      .assert();
    // -- Tareted tests
    testWordGuesserLogic
      .expect(
        "Verify updateCurrentWord places letters at the exact provided indices",
      )
      .value(() => {
        const logicTest = new WordGuesser([word]);
        const firstLetter = logicTest.getActualWord()[0];
        const indexes = charsAt(firstLetter, logicTest.getActualWord());

        logicTest.updateCurrentWord(firstLetter, indexes);
        return logicTest.getCurrentWord()[indexes[0]];
      })
      .toBe(word.charAt(0))
      .assert();

    testWordGuesserLogic
      .expect("gameOver identifies completed word")
      .value(() => {
        const overTest = new WordGuesser([word]);
        const uniqueChars = [...new Set(word.split(""))];
        uniqueChars.forEach((c) => overTest.guessLetter(c));
        return overTest.gameOver();
      })
      .toBe(true)
      .assert();

    // -- updateLetters
    const testUpdateLetters = test.describe("Utility: updateLetters");

    const letters = updateLetters(["A", "B", "C"]);
    testUpdateLetters
      .expect("updateLetters should append the correct number of LI elements")
      .value(letters.children.length)
      .toBe(3)
      .assert();
    testUpdateLetters
      .expect("updateLetters should handle empty arrays without error")
      .value(() => updateLetters([]).children.length)
      .toBe(0)
      .assert();

    // -- Test suite for Game Class Logic (Integration Testing)
    const testGameIntegration = test.describe("Game Class Integration");

    testGameIntegration
      .expect(
        "Game should update the DOM 'guessCount' display when a guess is made",
      )
      .value(() => {
        game.newGame();
        game.guessLetter.value = invalidLetter;
        game.guessButton.click();
        return game.guessCount.value;
      })
      .toBe("1")
      .assert();

    testGameIntegration
      .expect("Input field should be cleared after a guess is submitted")
      .value(() => {
        game.newGame();
        game.guessLetter.value = validLetter;
        game.guessButton.click();
        return game.guessLetter.value;
      })
      .toBe("")
      .assert();

    testGameIntegration
      .expect("Game should update notifications area on duplicate guess error")
      .value(() => {
        game.newGame();
        game.guessLetter.value = invalidLetter;
        game.guessButton.click();
        game.guessLetter.value = invalidLetter;
        game.guessButton.click();
        return game.notifications.innerText.toLowerCase().includes("🔁");
      })
      .toBe(true)
      .assert();

    testGameIntegration
      .expect(
        "UI 'guesses' list should contain a matching number of LI items to the guess count",
      )
      .value(() => {
        game.newGame();
        game.guessLetter.value = invalidLetter;
        game.guessButton.click();
        return (
          game.guesses.querySelectorAll("li").length === game.game.guessCount()
        );
      })
      .toBe(true)
      .assert();

    testGameIntegration
      .expect("Game should display '🔁' icon for duplicate bad guesses")
      .value(() => {
        game.newGame();
        const badLetter = invalidLetter;
        game.guessLetter.value = badLetter;
        game.guessButton.click();

        game.guessLetter.value = badLetter;
        game.guessButton.click();

        return game.notifications.innerText.includes("🔁");
      })
      .toBe(true)
      .assert();

    testGameIntegration
      .expect("Game should display '💎' icon for duplicate good guesses")
      .value(() => {
        game.newGame();
        const goodLetter = validLetter;
        game.guessLetter.value = goodLetter;
        game.guessButton.click();

        game.guessLetter.value = goodLetter;
        game.guessButton.click();

        return game.notifications.innerText.includes("💎");
      })
      .toBe(true)
      .assert();

    test.report();
  }
  wordChoices.forEach(tests);
}

class DOMReporter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.showFailedOnly = true;
  }

  render(rootSuite) {
    if (!this.container) return;
    this.container.appendChild(this.buildSuiteUI(rootSuite, 0));
  }

  buildSuiteUI(suite, depth) {
    const suiteDiv = document.createElement("div");
    suiteDiv.className = "suite-container";
    suiteDiv.style.marginLeft = `${depth * 20}px`;

    const title = document.createElement("h5");
    title.innerText = `Suite: ${suite.name}`;
    suiteDiv.appendChild(title);

    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";

    // Render Tests
    suite.tests.forEach((test) => {
      const item = document.createElement("li");
      item.className = test.isPassed ? "test-pass" : "test-fail";
      item.style.padding = "5px";
      item.style.borderLeft = `4px solid ${test.isPassed ? "#4CAF50" : "#f44336"}`;
      item.style.marginBottom = "5px";
      item.style.backgroundColor = test.isPassed ? "#e8f5e9" : "#ffebee";

      let content = `<span>${test.isPassed ? "✅" : "❌"} ${test.expectation}</span>`;

      if (!test.isPassed) {
        const expected = JSON.stringify(test.trialValue);
        const got = JSON.stringify(test.actualResult);
        content += `<div style="font-size: 0.8rem; color: #c62828; margin-top: 5px;">
                                <strong>Expected:</strong> ${expected} | <strong>Got:</strong> ${got}
                            </div>`;
      } else {
        if (this.showFailedOnly) return;
      }

      item.innerHTML = content;
      list.appendChild(item);
    });

    suiteDiv.appendChild(list);

    // Recursive call for sub-suites
    suite.subSuites.forEach((sub) => {
      suiteDiv.appendChild(this.buildSuiteUI(sub, depth + 1));
    });

    return suiteDiv;
  }

  renderFinalStats(stats) {
    const summary = document.createElement("div");
    summary.style.marginTop = "20px";
    summary.style.padding = "10px";
    summary.style.fontWeight = "bold";
    summary.style.borderTop = "2px solid #ccc";
    summary.innerText = `Final Result: ${stats.passed} / ${stats.total} Passed`;
    summary.style.color = stats.passed === stats.total ? "#2e7d32" : "#c62828";
    this.container.appendChild(summary);
  }
}
