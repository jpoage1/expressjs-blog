/**
 * Centers and pads a method array string to fit a fixed 10-character column width.
 */
function formatMethodString(methods) {
  const methodString = methods.join(", ");
  const totalWidth = 10;
  const leftPadding = Math.floor((totalWidth - methodString.length) / 2);
  const rightPadding = totalWidth - methodString.length - leftPadding;

  return " ".repeat(leftPadding) + methodString + " ".repeat(rightPadding);
}

/**
 * Formats and maps collected routes directly into the designated LogBuffer.
 */
function formatRoutesToBuffer(routes, buffer) {
  routes.forEach(({ methods, path }) => {
    const paddedMethods = formatMethodString(methods);
    buffer.push(`[${paddedMethods}] |      API      | ${path}`);
  });
}

module.exports = { formatMethodString, formatRoutesToBuffer };
