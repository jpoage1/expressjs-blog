const { winstonLogger } = require("./logging");
const { Client } = require("ldapts");

module.exports.getGroups = async function getGroups(username) {
  return [];
  try {
    const url = "ldap://10.8.0.1";
    const bindDN = "cn=admin,dc=jasonpoage,dc=com";
    const password = "9b4h655SrcIOLmK4u5Zldw";
    const userDN = `uid=${username},ou=People,dc=jasonpoage,dc=com`;

    const client = new Client({ url });

    try {
      await client.bind(bindDN, password);

      const { searchEntries } = await client.search("dc=jasonpoage,dc=com", {
        scope: "sub",
        // Find groups where this user's full DN is listed in the 'member' attribute
        filter: `(&(objectClass=groupOfNames)(member=${userDN}))`,
        attributes: ["cn"],
      });

      // Extract the 'cn' from each group found
      return searchEntries.map((entry) => entry.cn);
    } catch (err) {
      winstonLogger.warn("LDAP Search Error:" + err.message);
      throw err;
    } finally {
      await client.unbind();
    }
  } catch (e) {
    return e.stack;
  }
};
