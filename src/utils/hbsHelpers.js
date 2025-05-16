// src/utils/hbsHelpers.js
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
}

module.exports = { registerHelpers };
