function parseLogLine(line) {
  const parts = line.split(" ");
  if (parts.length < 1) return null;

  const ip = parts[0];
  const match = line.match(/"([^"]*)"/);
  if (!match) return null;

  const request = match[1].split(" ");
  if (request.length < 2) return null;

  return { ip, url: request[1] };
}

module.exports = { parseLogLine };
