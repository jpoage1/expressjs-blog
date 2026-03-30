/**
 * src/utils/evaluateRules.js
 */

function checkRequirement(rule, identity, groups) {
  const [type, value] = rule.split(":");
  if (type === "group") return groups.includes(value);
  if (type === "user") return identity === value;
  return false;
}

/**
 * Validates a single requirement block (Inner Array - Logical AND).
 */
function validateBlock(block, identity, groups) {
  const requirements = Array.isArray(block) ? block : [block];
  return requirements.every((rule) => checkRequirement(rule, identity, groups));
}

/**
 * Evaluates the full rule set (Outer Array - Logical OR).
 */
function evaluateRules(rules, session) {
  if (!rules || !rules.length) return true;

  const identity = session.user || session.preferred_username || session.name;
  const groups = session.groups || [];

  return rules.some((block) => validateBlock(block, identity, groups));
}

module.exports = { evaluateRules };

/**
 * Default policy is allow
 *
 * Policy types:
 * Allow: The item and its public children are visible
 * deny: Item only visible if the user and/or group rules match
 * deny-children: Item is visible, but children are not visible unless user and/or group match
 *
 * Rules Examples:
 *
 * rules: [] // -- No rules
 * rules: [ "user:username" ] // -- Allow user
 * rules: [ "group:groupname" ] // -- Allow group
 * rules: [
 * "user:username", // Can match user
 * "group:groupname", // Can match group
 * ]
 * rules: [ // Multiple rules
 *   ["group:group_a", "group:group_b"] // -- Must be in both groups
 *   ["user:username"] // -- Or can be user
 *   "user:username" // -- This means the same as the line above
 *   ["group:groupname"] // -- Or can be group
 *   "group:groupname" // -- This means the same as the line above
 * ] // -- Allow group
 *
 */
