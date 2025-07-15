// src/utils/postFileUtils.js
const matter = require("gray-matter");
const path = require("path");
const fs = require("fs").promises;

async function getAllPosts(baseDir, options = {}) {
  const { includeUnpublished = false } = options;

  const years = (await fs.readdir(baseDir, { withFileTypes: true })).filter(
    (dirent) => dirent.isDirectory() && /^\d{4}$/.test(dirent.name)
  );

  const allPosts = [];

  for (const yearDir of years) {
    const yearPath = path.join(baseDir, yearDir.name);
    const months = await fs.readdir(yearPath, { withFileTypes: true });

    for (const monthDir of months.filter((d) => d.isDirectory())) {
      const monthPath = path.join(yearPath, monthDir.name);
      const files = await fs.readdir(monthPath);

      const posts = await Promise.all(
        files
          .filter((f) => f.endsWith(".md"))
          .map(async (f) => {
            const slug = f.replace(/\.md$/, "");
            const filePath = path.join(monthPath, f);
            const fileContent = await fs.readFile(filePath, "utf8");
            const { data, content } = matter(fileContent);

            const excerpt = content.replace(/\n+/g, " ").slice(0, 200) + "...";

            // Filter unpublished posts in production unless explicitly included
            if (
              !data.published &&
              (process.env.NODE_ENV === "production" ||
                process.env.NODE_ENV === "testing") &&
              !includeUnpublished
            ) {
              return null;
            }
            const url = `/blog/${yearDir.name}/${monthDir.name}/${slug}`;

            return {
              url,
              slug,
              title: data.title || slug.replace(/-/g, " "),
              date: data.date || null,
              year: yearDir.name,
              month: monthDir.name,
              published: data.published,
              frontmatter: data, // Include full frontmatter for flexibility
              excerpt,
            };
          })
      );

      allPosts.push(...posts.filter(Boolean));
    }
  }

  return allPosts;
}

module.exports = { getAllPosts };
