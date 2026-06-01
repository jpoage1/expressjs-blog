// src/utils/processMenuLinks.js
const { winstonLogger } = require("#logging");
const { evaluateRules } = require("#utils/evaluateRules.js");

/**
 * Applies attribute promotion from a child to a parent.
 */
function promoteAttributes(parent, child) {
  const promote = child.promote;
  if (!promote) return;

  let keys = [];

  if (promote === "true" || promote === true) {
    keys = Object.keys(child).filter((k) => k !== "submenu" && k !== "promote");
  } else if (typeof promote === "string") {
    keys = [promote];
  } else if (Array.isArray(promote)) {
    keys = promote;
  }

  keys.forEach((key) => {
    parent[key] = child[key];
  });
}

/**
 * Processes menu links with policy inheritance and parent-override logic.
 * @param {Array} links - The menu items to filter.
 * @param {Object} session - The { isAuthenticated, user, groups } object.
 * @param {string} currentPath - The active URL path.
 * @param {string} inheritedPolicy - The policy passed down from the parent (default "allow").
 */
function processMenuLinks(
  links,
  session,
  currentPath,
  inheritedPolicy = "allow",
  baseUri,
) {
  if (!links) return [];
  if (!session)
    throw new Error(`Session is undefined: ${JSON.stringify(session)}`);

  return links
    .map((link) => {
      const item = { ...link };
      const activePolicy = item.policy || inheritedPolicy;
      // winstonLogger.info(
      //   JSON.stringify({ Label: item.label, Policy: activePolicy, session }),
      // );

      if (item.submenu) {
        const nextPolicy =
          activePolicy === "deny-children" ? "deny" : activePolicy;
        const processedSub = processMenuLinks(
          item.submenu,
          session,
          currentPath,
          nextPolicy,
        );

        const primaryChild = item.submenu[0];
        const isPrimaryVisible = processedSub.some(
          (s) => s.label === primaryChild.label,
        );

        // Promotion Logic: Trigger if only the primary child remains or the menu is empty
        if (
          (processedSub.length === 0 ||
            (processedSub.length === 1 && isPrimaryVisible)) &&
          primaryChild?.promote
        ) {
          const childPolicy = primaryChild.policy || "allow"; // Requirement: Default to allow

          const isChildAccessible =
            childPolicy === "allow" ||
            (childPolicy === "deny" &&
              session.isAuthenticated &&
              evaluateRules(primaryChild.rules, session));

          if (isChildAccessible) {
            promoteAttributes(item, primaryChild);

            // Policy inheritance: Apply child policy only if the child has its own children
            if (primaryChild.submenu && primaryChild.submenu.length > 0) {
              item.policy = childPolicy;
              item.submenu = processMenuLinks(
                primaryChild.submenu,
                session,
                currentPath,
                item.policy,
              );
            } else {
              item.policy = childPolicy;
              delete item.submenu;
            }
          }
        } else {
          // Standard Dropdown: Filter out any item with the 'promote' key from the list
          item.submenu = processedSub.filter((s) => !s.promote);
          if (item.submenu.length === 0) delete item.submenu;
        }
      }

      // Path/Resource Normalization
      if (item.appendCurrentPath && typeof item.href === "string") {
        if (currentPath !== "/" && !item.href.endsWith(currentPath))
          item.href += currentPath;
      } else if (item.html || item.frame || item.mermaid) {
        item.href = `/docs/${item.html || item.frame || item.mermaid}`;
      }

      return item;
    })
    .filter((item) => {
      // Final Security Gate (Parent Wins)
      const policy = item.policy || inheritedPolicy;
      if (policy === "allow" || policy === "deny-children") return true;
      if (policy === "deny") {
        console.log(`[SESSION_DEBUG]: ${JSON.stringify(session)}`);
        return session.isAuthenticated && evaluateRules(item.rules, session);
      }
      return false;
    });
}
module.exports = processMenuLinks;
