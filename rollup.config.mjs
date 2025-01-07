import path from "path";
import { fileURLToPath } from "url";

import alias from "@rollup/plugin-alias";
import cleanup from "rollup-plugin-cleanup";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import license from "rollup-plugin-license";
import polyfill from "rollup-plugin-polyfill";
import resolve from "@rollup/plugin-node-resolve";

// List of browsers to build for.
const browsers = ["chrome", "firefox", "safari"];

const processEnvConf = {
  TOKEN_SIGNING_BACKWARDS_COMPATIBILITY: process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY,
}

const pluginsConf = (environment) => [
  alias({
    entries: [{
      find:        "@web-eid.js",
      replacement: path.resolve(import.meta.dirname, "dist/lib/web-eid.js/src"),
    }],
  }),
  resolve({ rootDir: "./dist" }),
  cleanup({ comments: ["jsdoc"] }), // Keep jsdoc comments
  license({
    banner: {
      content: {
        file:     path.join(import.meta.dirname, "LICENSE"),
        encoding: "utf-8",
      },
    },
  }),

  ...(environment === "chrome"      ? [ polyfill(["webextension-polyfill"]) ] : []),
  ...(environment !== "page-script" ? [ injectProcessEnv(processEnvConf)    ] : []),
];

// Use flatMap() to create a configuration for each browser and each of the "content" and "background" scripts.
const browserConfigs = browsers.flatMap((browser) =>
  ["content", "background"].map((name) => ({
    input:  `./dist/${browser}/${name}/${name}.js`,
    output: [
      {
        file:      `dist/${browser}/${name}.js`,
        format:    "iife",
        sourcemap: name === "background",
      },
    ],
    plugins: pluginsConf(browser),
    context: "window",
  }))
);

// Define the configuration for the TokenSigning compatibility page script for Chrome and Firefox.
const tokenSigningPageConfig = {
  input:  "./dist/firefox/resources/token-signing-page-script.js",
  output: ["chrome", "firefox"].map((browser) => ({
    file:   `dist/${browser}/token-signing-page-script.js`,
    format: "iife",
  })),
  plugins: pluginsConf("page-script"),
  context: "window",
};

// Export all configurations as an array.
export default [...browserConfigs, tokenSigningPageConfig];
