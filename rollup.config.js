import path from "path";

import alias from "@rollup/plugin-alias";
import cleanup from "rollup-plugin-cleanup";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import license from "rollup-plugin-license";
import resolve from "@rollup/plugin-node-resolve";

const projectRootDir = path.resolve(__dirname);

const libraryAlias = alias({
  entries: [
    { find: "@web-eid.js", replacement: path.resolve(projectRootDir, "dist/lib/web-eid.js/src") },
  ],
});

const pluginsConf = [
  libraryAlias,
  resolve({ rootDir: "./dist" }),
  cleanup({ comments: ["jsdoc"] }), // Keep jsdoc comments
  injectProcessEnv({
    DEBUG:                                 process.env.DEBUG,
    TOKEN_SIGNING_BACKWARDS_COMPATIBILITY: process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY,
  }),
  license({
    banner: {
      content: {
        // eslint-disable-next-line no-undef
        file: path.join(__dirname, "LICENSE"),
        encoding: "utf-8",
      },
    },
  }),
];

export default [
  ...["content", "background"].map((name) => ({
    input: `./dist/chrome/${name}/${name}.js`,

    output: [
      {
        file:      `dist/chrome/${name}.js`,
        format:    "iife",
        sourcemap: name === "background",
      },
    ],

    plugins: pluginsConf,

    context: "window",
  })),

  ...["content", "background"].map((name) => ({
    input: `./dist/firefox/${name}/${name}.js`,

    output: [
      {
        file:      `dist/firefox/${name}.js`,
        format:    "iife",
        sourcemap: name === "background",
      },
    ],

    plugins: pluginsConf,

    context: "window",
  })),

  ...["content", "background"].map((name) => ({
    input: `./dist/safari/${name}/${name}.js`,

    output: [
      {
        file:      `dist/safari/${name}.js`,
        format:    "iife",
        sourcemap: name === "background",
      },
    ],

    plugins: pluginsConf,

    context: "window",
  })),

  {
    input: "./dist/firefox/resources/token-signing-page-script.js",

    output: [
      {
        file:   "dist/chrome/token-signing-page-script.js",
        format: "iife",
      },
      {
        file:   "dist/firefox/token-signing-page-script.js",
        format: "iife",
      },
    ],

    plugins: pluginsConf,

    context: "window",
  },
];
