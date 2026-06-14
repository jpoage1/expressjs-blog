function charInChars(char, chars) {
  const indexes = charsAt(char, chars);
  return indexes !== false;
}
function charsAt(char, chars) {
  let indexes = [];
  for (let i = 0; i < chars.length; i++) {
    if (char == chars[i]) {
      indexes.push(i);
    }
  }
  return indexes.length == 0 ? false : indexes;
}
function updateLetters(chars) {
  const letters = document.createElement("ul");
  // create a DOM element for each letter
  chars.forEach((char) => {
    const item = document.createElement("li");
    item.innerText = char;
    letters.appendChild(item);
  });
  return letters;
}
class InvalidGuessError extends Error {}
class DuplicateGoodGuessError extends Error {}
class DuplicateBadGuessError extends Error {}
class BadGuessError extends Error {}
class WordGuesser {
  static _scores = [];
  // -- Constants
  actualWord = [];

  // -- Data
  goodGuesses = [];
  badGuesses = [];
  lettersLeft = [];
  currentWord = [];

  startTime = null;
  endTime = null;

  constructor(wordChoices) {
    this.wordChoices = wordChoices;
    this.newGame();
  }

  // -- Clear the current game data and start a new game
  newGame() {
    this.badGuesses = [];
    this.goodGuesses = [];
    this.currentWord = [];
    const randomChoice = Math.floor(Math.random() * this.wordChoices.length);
    this.actualWord = this.wordChoices[randomChoice].split("");

    // -- Create placeholder entries for the currentWord
    for (let i = 0; i < this.actualWord.length; i++) {
      this.currentWord[i] = "_";
    }
    this.startTime = Date.now();
  }

  // -- Determines if a letter is in a list of letters
  guessLetter(letter) {
    this.validateInput(letter);
    // -- Find the match
    const badGuessIndex = charInChars(letter, this.badGuesses);
    const goodGuessIndex = charInChars(letter, this.goodGuesses);

    // -- Check if the letter has been guessed already
    if (badGuessIndex !== false) {
      throw new DuplicateBadGuessError(
        `The letter '${letter}' has already been guessed`,
      );
    }
    if (goodGuessIndex !== false) {
      throw new DuplicateGoodGuessError(
        `The letter '${letter}' has already been guessed`,
      );
    }

    // -- Determine if the letter exists in the actual word
    const letterIndexes = charsAt(letter, this.actualWord);
    if (letterIndexes === false) {
      // Add the letter to the list of guessesd letters
      this.badGuesses.push(letter);
      throw new BadGuessError(
        `Sorry, the letter ${letter} does not exist in the word`,
      );
    }
    this.goodGuesses.push(letter);

    this.updateCurrentWord(letter, letterIndexes);

    return letterIndexes;
  }

  getActualWord() {
    return this.actualWord;
  }
  getCurrentWord() {
    return this.currentWord;
  }
  updateCurrentWord(letter, indexes) {
    for (let i = 0; i < indexes.length; i++) {
      this.currentWord[indexes[i]] = letter;
    }
  }
  setCurrentWord(currentWord) {
    if (!Array.isArray(currentWord)) {
      throw Error("The current word is not an array!");
    }
    this.currentWord = currentWord;
  }
  getUniqueCharCount() {
    return new Set(this.actualWord).size;
  }
  getMaxGuesses() {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("maxGuesses");
    const defaultMax = this.getUniqueCharCount() * 3;

    if (override && !isNaN(override)) {
      const requestedMax = parseInt(override, 10);
      // Use Math.min to ensure the result is never more than defaultMax
      return Math.min(requestedMax, defaultMax);
    }

    return defaultMax;
  }
  getTotalGuesses() {
    return this.badGuesses.length + this.goodGuesses.length;
  }
  getGuesses() {
    return this.badGuesses;
  }
  getDuration() {
    const end = this.endTime || Date.now();
    return (end - this.startTime) / 1000;
  }
  _getScores() {
    return {
      incorrect: this.badGuesses.length,
      total: this.getTotalGuesses(),
      time: this.getDuration(),
      solved: this.wasSolved,
    };
  }
  guessCount() {
    return this.badGuesses.length + this.goodGuesses.length;
  }
  checkWordCompletion() {
    for (let i = 0; i < this.actualWord.length; i++) {
      if (this.currentWord[i] != this.actualWord[i]) return false;
    }
    return true;
  }
  gameOver() {
    // -- Check if game end has already been declared
    if (this.endTime != null) {
      return true;
    }

    const solved = this.checkWordCompletion();
    const failed = this.getTotalGuesses() >= this.getMaxGuesses();

    if (solved || failed) {
      this.endTime = Date.now();
      this.wasSolved = solved; // Store result status
      return true;
    }
    WordGuesser._scores.push(this._getScores());
  }
  validateInput(input) {
    const regex = /^[a-zA-Z ]$/;
    const result = regex.test(input);
    if (!result) {
      throw new InvalidGuessError(
        `You must only guess a single letter. Received: '${input}'`,
      );
    }
  }
  static resetScores() {
    WordGuesser._scores = [];
  }
  static getTotalGamesPlayed() {
    return WordGuesser._scores.length;
  }
  static getScores() {
    const scores = WordGuesser.calculateScores();
    return {
      totalWordsAttempted: scores.attempts,
      totalWordsCompleted: scores.solvedCount,
      totalIncorrectGuesses: scores.incorrect,
      avgGuessesPerWord: scores.avgGuesses.toFixed(2),
      avgTimePerWord: scores.avgTime.toFixed(2),
    };
  }
  static calculateScores() {
    let totals = {
      incorrect: 0,
      guesses: 0,
      time: 0,
      solvedCount: 0,
    };

    for (let i = 0; i < WordGuesser._scores.length; i++) {
      const scores = WordGuesser._scores[i];
      totals.incorrect += scores.incorrect;
      totals.guesses += scores.total;
      totals.time += scores.time;

      if (scores.solved) {
        totals.solvedCount++;
      }
    }
    const totalGamesPlayed = WordGuesser.getTotalGamesPlayed();
    return {
      attempts: totalGamesPlayed,
      solvedCount: totals.solvedCount,
      incorrect: totals.incorrect,
      avgGuesses: totalGamesPlayed ? totals.guesses / totalGamesPlayed : 0,
      avgTime: totalGamesPlayed ? totals.time / totalGamesPlayed : 0,
    };
  }
}
class GameFields {
  constructor(fieldNames = {}) {
    const defaults = {
      // -- User info
      userName: "user_name",
      userInfoForm: "user_info",
      saveUserButton: "save_user_button",

      // -- Game Inputs
      alphabetContainer: "alphabet_container",
      gameForm: "game_form",
      guesses: "guesses",
      guessCount: "guess_count",
      guessLetter: "guess_letter",
      guessButton: "guess_button",
      currentWord: "current_word",
      notifications: "notifications",
      wordlistFile: "wordlist_file",

      playAgainButton: "play_again",
      quitButton: "quit_game",

      // Game dialogs
      gameIntro: "game_intro",
      gameHowTo: "game-howto",

      // -- Scoreboard
      scoreboard: "scoreboard",
      totalWordsAttempted: "total_words_attempted",
      totalWordsCompleted: "total_words_completed",
      totalIncorrectGuesses: "total_incorrect_guesses",
      avgGuessesPerWord: "average_guesses_per_word",
      avgTimePerWord: "average_time_per_word",
      currentGameResult: "current_game_result",
      currentGameIncorrect: "current_game_incorrect",
      currentGameTime: "current_game_time",
    };

    // Merge provided names with defaults
    const config = { ...defaults, ...fieldNames };

    // Automatically assign elements to "this"
    Object.keys(config).forEach((key) => {
      this[key] = document.getElementById(config[key]);
    });
  }
}
function reset(fields) {
  fields.gameIntro.innerText =
    "The game that insults you, whether you win or lose!";
  fields.guessButton.value = "Guess";
  fields.notifications.innerText = "";
  fields.guessCount.value = "0";
  // fields.guessLetter.value = "";
  fields.guesses.replaceChildren();
  fields.currentWord.replaceChildren();
  fields.gameHowTo.style.display = "block";
}
class Game {
  constructor(wordChoices, fields) {
    Object.assign(this, fields);
    this.defaultWordChoices = wordChoices;
    this.activeWordChoices = wordChoices;

    this.userName.addEventListener("focus", (event) => {
      if (event.target.value == "Guest") {
        this.userName.value = "";
      }
    });
    this.userName.addEventListener("blur", (event) => {
      if (event.target.value.trim() == "") {
        this.userName.value = "Guest";
      }
    });
    this.userInfoForm.onsubmit = async (event) => {
      event.preventDefault();
      const file = this.wordlistFile.files[0];
      if (file) {
        this.startGameFromFile(file);
      } else {
        this.activeWordChoices = this.defaultWordChoices;
        this.newGame();
      }
    };
    this.playAgainButton.onclick = (event) => this.newGame();
    this.quitButton.onclick = (event) => this.handleQuit();
    this.gameForm.onsubmit = (event) => {
      event.preventDefault();
      if (!this.game.gameOver()) {
        this.updateGuessButton();
        this.handleGuessedLetter(event);
      } else {
        this.newGame();
      }
    };
  }
  startGameFromFile(file) {
    try {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const words = processWordList(event.target.result);
          validateWordList(words);
          this.activeWordChoices = words;
          this.updateNotifications("📁", "Custom word list loaded!");
          this.newGame();
        } catch (e) {
          window.alert(e);
        }
      };

      reader.onerror = () => {
        window.alert(new Error("File reading failed."));
      };

      return reader.readAsText(file);
    } catch (e) {
      this.updateNotifications("⚠️", e.message);
      return; // Stop if the file is invalid
    }
  }
  async init() {
    this.dialogs = await import("./dialogs.js");
  }
  showScoreboard() {
    this.updateScoreboard(this.game);
    this.scoreboard.style.display = "flex";
  }
  updateGuessButton() {
    this.guessButton.value = this.randomMessage(this.dialogs.guessButton);
  }
  updateScoreboard(currentGame) {
    // 1. Update Current Game Section
    const currentStats = currentGame._getScores();
    this.currentGameResult.innerText = currentStats.solved ? "WON" : "LOST";
    this.currentGameResult.className = `sb-value ${currentStats.solved ? "success-msg" : "error-msg"}`;
    this.currentGameIncorrect.innerText = currentStats.incorrect;
    this.currentGameTime.innerText = currentStats.time.toFixed(2);

    // 2. Update Cumulative Section
    const overallScores = WordGuesser.getScores();
    this.totalWordsAttempted.innerText = overallScores.totalWordsAttempted;
    this.totalWordsCompleted.innerText = overallScores.totalWordsCompleted;
    this.totalIncorrectGuesses.innerText = overallScores.totalIncorrectGuesses;
    this.avgGuessesPerWord.innerText = overallScores.avgGuessesPerWord;
    this.avgTimePerWord.innerText = overallScores.avgTimePerWord;
  }
  renderAlphabet() {
    const container = document.getElementById("alphabet_container");
    this.alphabetContainer.innerHTML = ""; // Clear for new game

    "abcdefghijklmnopqrstuvwxyz".split("").forEach((char) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = char.toUpperCase();
      btn.className = "letter-btn";

      // Custom attribute to find this button later by character
      btn.dataset.char = char;

      btn.onclick = () => {
        // 1. Remove selection from previous button
        if (this.selectedButton) {
          this.selectedButton.classList.remove("selected");
        }

        this.guessLetter.value = char;
        this.selectedButton = btn;
        btn.classList.add("selected");

        this.guessLetter;
      };
      container.appendChild(btn);
    });
  }
  reset() {
    reset(this);
  }
  handleQuit() {
    this.userInfoForm.style.display = "block";
    this.gameForm.style.display = "none";
    this.scoreboard.style.display = "none";
    WordGuesser.resetScores();
    this.reset();
  }
  newGame() {
    this.reset();
    this.game = new WordGuesser(this.activeWordChoices);
    this.renderAlphabet();
    this.updateCurrentWord(this.game.getCurrentWord());
    this.updateGuesses(this.game.getGuesses());
    this.updateGuessCount(this.game.guessCount());
    this.userInfoForm.style.display = "none";
    this.gameForm.style.display = "block";
    this.scoreboard.style.display = "none";
  }
  // -- Getters
  getGuess() {
    return this.guessLetter.value;
  }
  getUserName() {
    return this.userName.value;
  }
  // -- Setters
  clearGuess() {
    this.guessLetter.value = "";
  }
  updateGuessCount(count) {
    this.guessCount.value = count;
  }
  updateGuesses(chars) {
    const letters = updateLetters(chars);
    this.guesses.replaceChildren(...letters.childNodes);
  }
  invalidGuessError() {
    const message = this.randomMessage(this.dialogs.invalidGuess);
    this.updateNotifications("🚫", message);
  }
  duplicateGoodGuessError() {
    const message = this.randomMessage(this.dialogs.duplicateGoodGuess);
    this.updateNotifications("💎", message);
  }
  duplicateBadGuessError() {
    const message = this.randomMessage(this.dialogs.duplicateBadGuess);
    this.updateNotifications("🔁", message);
  }
  badGuessError() {
    const message = this.randomMessage(this.dialogs.badGuess);
    this.updateNotifications("❌", message);
  }
  goodGuess() {
    const message = this.randomMessage(this.dialogs.goodGuess);
    this.updateNotifications("✅", message);
  }
  gameOver() {
    this.guessButton.value = this.randomMessage(
      this.dialogs.guessButtonDefaultValue,
    );
    const message = this.randomMessage(this.dialogs.gameOver);
    this.updateNotifications("🏆", message);
    this.showScoreboard();
  }
  changeGameIntro() {
    let messages = [];
    const totalGamesPlayed = WordGuesser.getTotalGamesPlayed();
    if (totalGamesPlayed == 0) {
      messages = this.dialogs.gameIntroInitial;
    } else if (totalGamesPlayed >= 1) {
      messages = this.dialogs.gameIntro;
    }
    const message = this.randomMessage(messages);
    this.updateGameIntro(message);
  }
  updateGameIntro(message) {
    this.gameIntro.innerText = message;
  }
  updateNotifications(icon, message) {
    this.notifications.innerText = `${icon} ${message}`;
  }
  updateCurrentWord(chars) {
    const letters = updateLetters(chars);
    this.currentWord.replaceChildren(...letters.childNodes);
  }

  // -- Event handlers
  handleGuessedLetter(event) {
    const letter = this.getGuess();
    if (!letter) return;

    const game = this.game;

    if (game.guessCount() == 0) {
      this.changeGameIntro();
      this.gameHowTo.style.display = "none";
    }

    try {
      const goodGuess = game.guessLetter(letter);
      this.goodGuess();

      // Disable the button since it was a correct guess
      if (this.selectedButton) {
        this.selectedButton.disabled = true;
        this.selectedButton.classList.remove("selected");
      }
    } catch (e) {
      if (e instanceof BadGuessError) {
        this.badGuessError();
        // Disable even on bad guesses to prevent duplicates
        if (this.selectedButton) {
          this.selectedButton.disabled = true;
          this.selectedButton.classList.remove("selected");
        }
      } else if (e instanceof DuplicateBadGuessError) {
        this.duplicateBadGuessError();
      } else if (e instanceof DuplicateGoodGuessError) {
        this.duplicateGoodGuessError();
      } else if (e instanceof InvalidGuessError) {
        this.invalidGuessError();
      } else {
        this.updateNotifications("⚠️", e.message);
      }
    } finally {
      const currentWord = game.getCurrentWord();
      this.updateCurrentWord(currentWord);
      this.updateGuesses(game.getGuesses());
      this.updateGuessCount(game.guessCount());
      this.clearGuess();
      this.selectedButton = null;
      if (game.gameOver()) {
        this.gameOver();
      }
    }
  }
  randomMessage(messagesFn) {
    const messages = messagesFn(this.getGuess(), this.getUserName());
    const randomChoice = Math.floor(Math.random() * messages.length);
    return messages[randomChoice];
  }
}

function processWordList(text) {
  const lines = text.split(/\r?\n/);
  const processedWords = [];

  for (let i = 0; i < lines.length; i++) {
    const word = lines[i].trim();
    if (word.length >= 5) {
      processedWords.push(word);
    }
  }

  return processedWords;
}

function validateWordList(words) {
  if (words.length < 25) {
    throw new Error(
      "File must contain at least 25 words/phrases of 5+ characters.",
    );
  }
}
document.addEventListener("DOMContentLoaded", async (_) => {
  const wordChoices = (await import("./wordlist.js")).default;
  const fields = new GameFields();
  await new Game(wordChoices, fields).init();
});
