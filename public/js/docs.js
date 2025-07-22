Handlebars.registerHelper(
  "isObject",
  (v) => v && typeof v === "object" && !Array.isArray(v)
);
Handlebars.registerHelper("isArray", Array.isArray);
Handlebars.registerHelper("json", (ctx) => JSON.stringify(ctx, null, 2));
