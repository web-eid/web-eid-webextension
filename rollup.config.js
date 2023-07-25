import path from "path";

import alias from "@rollup/plugin-alias";
import cleanup from "rollup-plugin-cleanup";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import license from "rollup-plugin-license";
import resolve from "@rollup/plugin-node-resolve";

const projectRootDir = path.resolve(__dirname);

const pluginsConf = [
  alias({
    entries: [{
      find: "@web-eid.js",
      replacement: path.resolve(projectRootDir, "dist/lib/web-eid.js/src")
    }],
  }),
  resolve({ rootDir: "./dist" }),
  cleanup({ comments: ["jsdoc"] }), // Keep jsdoc comments
  injectProcessEnv({
    DEBUG:                                 process.env.DEBUG,
    TOKEN_SIGNING_BACKWARDS_COMPATIBILITY: process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY,
  }),
  license({
    banner: {
      content: {
        file: path.join(projectRootDir, "LICENSE"),
        encoding: "utf-8",
      },
    },
  }),
];

// List of browsers to build for.
const browsers = ["chrome", "firefox", "safari"];

// Use flatMap() to create a configuration for each browser and each of the "content" and "background" scripts.
const browserConfigs = browsers.flatMap((browser) =>
  ["content", "background"].map((name) => ({
    input: `./dist/${browser}/${name}/${name}.js`,
    output: [
      {
        file: `dist/${browser}/${name}.js`,
        format: "iife",
        sourcemap: name === "background",
      },
    ],
    plugins: pluginsConf,
    context: "window",
  }))
);

// Define the configuration for the TokenSigning compatibility page script for Chrome and Firefox.
const tokenSigningPageConfig = {
  input: "./dist/firefox/resources/token-signing-page-script.js",
  output: ["chrome", "firefox"].map((browser) => ({
    file: `dist/${browser}/token-signing-page-script.js`,
    format: "iife",
  })),
  plugins: pluginsConf,
  context: "window",
};

// Export all configurations as an array.
export default [...browserConfigs, tokenSigningPageConfig];
