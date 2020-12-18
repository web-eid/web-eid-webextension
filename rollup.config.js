import resolve from "@rollup/plugin-node-resolve";
import polyfill from "rollup-plugin-polyfill";

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
      resolve(),
      polyfill(["webextension-polyfill"]),
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
      resolve(),
    ],

    context: "window",
  })),
];
