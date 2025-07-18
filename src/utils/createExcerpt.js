// src/utils/createExcerpt.js

function createExcerpt(content, limit = 200) {
  const plain = content
    .replace(/[*_`~#>\[\]()]/g, "") // strip basic markdown syntax
    .replace(/\n+/g, " ") // flatten newlines
    .replace(/\s+/g, " ") // normalize spaces
    .trim();

  if (plain.length <= limit) return plain;

  const truncated = plain.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.slice(0, lastSpace) + "…";
}

module.exports = createExcerpt;
