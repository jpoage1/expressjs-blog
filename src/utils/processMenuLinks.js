// src/utils/processMenuLinks.js

/**
 * Evaluates access rules against the current identity context.
 * * Rules:
 * - Outer array: Logical OR (Success if any requirement block passes)
 * - Inner array: Logical AND (Success if all rules in the block pass)
 * * @param {Array<Array<string>>} rules - Nested rule set
 * @param {Object} auth - { isAuthenticated, user, groups }
 */
function evaluateRules(rules, session) {
  if (!rules || !rules.length) return true;

  const { user, groups = [] } = session;

  return rules.some((requirement) =>
    requirement.every((rule) => {
      const [type, value] = rule.split(":");
      switch (type) {
        case "group":
          return groups.includes(value);
        case "user":
          return user === value;
        default:
          return false;
      }
    }),
  );
}
function processMenuLinks(links, session, currentPath) {
  return links
    .filter((link) => {
      const policy = link.policy || "allow";

      if (policy == "allow" || policy === "deny-children") {
        return true;
      }

      // 1. Check basic security requirement
      if (policy == "deny" && !session.isAuthenticated) return false;

      // 2. Check specific rules if they exist
      return evaluateRules(link.rules, session);
    })
    .map((link) => {
      const item = { ...link };
      if (item.appendCurrentPath && typeof item.href === "string") {
        if (currentPath !== "/" && !item.href.endsWith(currentPath)) {
          item.href = item.href + currentPath;
        }
      } else if (item.html) {
        item.href = `/docs/hexa/${item.html}`; // fixme
      } else if (item.frame) {
        item.href = `/docs/hexa/${item.frame}`; // fixme
      } else if (item.mermaid) {
        item.href = `/docs/hexa/${item.mermaid}`; // fixme
      }
      if (item.submenu) {
        item.submenu = processMenuLinks(item.submenu, session, currentPath);
        if (!item.submenu.length) delete item.submenu;
      }
      return item;
    });
}
module.exports = processMenuLinks;
