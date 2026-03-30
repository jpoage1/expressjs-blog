// src/utils/evaluateRules.js
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
module.exports = { evaluateRules };
