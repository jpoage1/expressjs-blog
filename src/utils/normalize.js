exports.normalizeTag = function (tag) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, " ");
};
