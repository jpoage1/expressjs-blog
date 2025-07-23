import Reveal from "https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.esm.js";
import RevealMarkdown from "https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/markdown/markdown.esm.js";
import RevealHighlight from "https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/plugin/highlight/highlight.esm.js";

const deck = new Reveal({
  hash: true,
  slideNumber: true,
  plugins: [RevealMarkdown, RevealHighlight],
  embedded: true,
  controls: true,
  progress: true,
  history: true,
  center: true,
  transition: "slide",
});

deck.initialize();
