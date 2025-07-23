function registerHelpers(hbs) {
  hbs.handlebars.registerHelper("formatMonth", function (monthStr) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const index = parseInt(monthStr, 10) - 1;
    if (index < 0 || index > 11) return monthStr;
    return monthNames[index];
  });

  hbs.handlebars.registerHelper("formatDate", function (date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  hbs.handlebars.registerHelper("isObject", function (value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  });

  hbs.handlebars.registerHelper("isArray", function (value) {
    return Array.isArray(value);
  });
  hbs.handlebars.registerHelper(
    "extractCrossCuttingSummary",
    function (context) {
      for (const key in context) {
        if (key.replace(/\s+/g, "").toLowerCase() === "crosscuttingsummary") {
          return context[key];
        }
      }
      return null;
    }
  );
}

module.exports = { registerHelpers };
