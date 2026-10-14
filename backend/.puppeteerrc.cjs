const { join } = require("path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to be within the project directory
  // so it persists across deployment build and run steps on Render / Railway / Docker
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
