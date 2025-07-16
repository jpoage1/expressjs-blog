// build-static.js
const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");
const handlebars = require("handlebars");

const postsDir = path.join(__dirname, "posts");
const outputDir = path.join(__dirname, "static");

// Load and compile templates
async function loadTemplate(name) {
  const file = await fs.readFile(
    path.join(__dirname, "src", "views", "pages", `${name}.handlebars`),
    "utf8"
  );
  return handlebars.compile(file);
}

async function getAllPosts() {
  const years = await fs.readdir(postsDir);
  let posts = [];

  for (const year of years) {
    const yearDir = path.join(postsDir, year);
    const months = await fs.readdir(yearDir);

    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const files = await fs.readdir(monthDir);

      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = path.join(monthDir, file);
        const contentRaw = await fs.readFile(filePath, "utf8");
        const { data: frontmatter, content } = matter(contentRaw);
        posts.push({
          year,
          month,
          name: path.basename(file, ".md"),
          frontmatter,
          content,
        });
      }
    }
  }

  return posts;
}

async function build() {
  // Prepare output directories
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Load templates
  const postTemplate = await loadTemplate("post");
  const homeTemplate = await loadTemplate("home");
  const errorTemplate = await loadTemplate("error");

  // Build posts pages
  const posts = await getAllPosts();

  for (const post of posts) {
    const htmlContent = marked(post.content);
    const context = {
      title: post.frontmatter.title,
      date: post.frontmatter.date,
      author: post.frontmatter.author,
      content: htmlContent,
    };

    const html = postTemplate(context);
    const outDir = path.join(outputDir, "post", post.year, post.month);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, `${post.name}.html`), html, "utf8");
  }

  // Build home page
  const homeContext = {
    title: "Blog Home",
    content: "Welcome to the blog.",
  };
  const homeHtml = homeTemplate(homeContext);
  await fs.writeFile(path.join(outputDir, "index.html"), homeHtml, "utf8");

  // Optionally build error page
  const errorContext = {
    statusCode: 404,
    title: "Not Found",
    message: "The requested blog post could not be found.",
    content: "",
  };
  const errorHtml = errorTemplate(errorContext);
  await fs.writeFile(path.join(outputDir, "404.html"), errorHtml, "utf8");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
