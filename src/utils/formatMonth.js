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

function formatMonth(monthStr) {
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return monthStr;
  return monthNames[monthIndex];
}

module.exports = { formatMonth };
