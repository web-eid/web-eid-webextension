import path from "path";

import alias from "@rollup/plugin-alias";
import cleanup from "rollup-plugin-cleanup";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import license from "rollup-plugin-license";
import polyfill from "rollup-plugin-polyfill";
import resolve from "@rollup/plugin-node-resolve";

const projectRootDir = path.resolve(__dirname);

const libraryAlias = alias({
  entries: [
    { find: "@web-eid.js", replacement: path.resolve(projectRootDir, "dist/lib/web-eid.js/src") },
  ],
});

export default [
  ...["content", "background"].map((name) => ({
    input: `./dist/firefox/${name}/${name}.js`,

    output: [
      {
        file:      `dist/firefox/${name}.js`,
        format:    "iife",
        sourcemap: true,
      },
    ],

    plugins: [
      libraryAlias,
      resolve({ rootDir: "./dist" }),
      polyfill(["webextension-polyfill"]),
      cleanup({ comments: ["jsdoc"] }), // Keep jsdoc comments
      injectProcessEnv({
        DEBUG:                                 process.env.DEBUG,
        TOKEN_SIGNING_BACKWARDS_COMPATIBILITY: process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY,
      }),
      license({
        banner: {
          content: {
            // eslint-disable-next-line no-undef
            file:     path.join(__dirname, "LICENSE"),
            encoding: "utf-8",
          },
        },
      }),
    ],

    context: "window",
  })),

  ...["content", "background"].map((name) => ({
    input: `./dist/safari/${name}/${name}.js`,

    output: [
      {
        file:      `dist/safari/${name}.js`,
        format:    "iife",
        sourcemap: true,
      },
    ],

    plugins: [
      libraryAlias,
      resolve({ rootDir: "./dist" }),
      cleanup({ comments: ["jsdoc"] }),
      injectProcessEnv({
        DEBUG:                                 process.env.DEBUG,
        TOKEN_SIGNING_BACKWARDS_COMPATIBILITY: process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY,
      }),
      license({
        banner: {
          content: {
            // eslint-disable-next-line no-undef
            file:     path.join(__dirname, "LICENSE"),
            encoding: "utf-8",
          },
        },
      }),
    ],

    context: "window",
  })),

  {
    input: "./dist/firefox/resources/token-signing-page-script.js",

    output: [
      {
        file:      "dist/firefox/token-signing-page-script.js",
        format:    "iife",
        sourcemap: true,
      },
    ],

    plugins: [
      libraryAlias,
      resolve({ rootDir: "./dist" }),
      cleanup({ comments: ["jsdoc"] }),
      license({
        banner: {
          content: {
            // eslint-disable-next-line no-undef
            file:     path.join(__dirname, "LICENSE"),
            encoding: "utf-8",
          },
        },
      }),
    ],

    context: "window",
  },
];
