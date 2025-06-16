import {
  cp,
  rm,
  exec,
  zip,
  replace,
  appendToFile,
  rem,
  pkg,
  write,
  getSourceDateEpoch,
  manifestVersion,
} from "./build-utils.mjs";

let sourceDateEpoch;

const targets = {
  async clean() {
    rem(
      "Cleaning the dist directory"
    );
    await rm("./dist");
  },

  async test() {
    rem(
      "Running tests"
    );
    await exec("jest" , ["-i", "--silent", "--verbose", "--rootDir", "./src"]);
  },

  async compile() {
    rem(
      "Compiling TypeScript files to ES6 modules in dist/src"
    );
    await exec("npx", ["tsc"]);
  },

  async bundle() {
    if (pkg.version == manifestVersion) {
      rem(
        `Build version: ${pkg.version}`
      );
    } else {
      rem(
        `Build version:    ${pkg.version}`,
        `Manifest version: ${manifestVersion}`
      );
    }

    await replace("./dist/src/config.js", "{{package.version}}", pkg.version);

    rem(
      "Preparing the Chrome dist directory for:",
      "- Google Chrome",
      "- Chromium",
      "- Microsoft Edge",
      "- Opera",
    );
    await cp("./dist/src", "./dist/chrome");

    rem(
      "Preparing the Firefox dist directory"
    );
    await cp("./dist/src", "./dist/firefox");
    await appendToFile("./dist/firefox/background/background.js", "./dist/firefox/background-firefox/consent.js");

    rem(
      "Preparing the Safari dist directory"
    );
    await cp("./dist/src", "./dist/safari");
    await cp("./dist/safari/background-safari", "./dist/safari/background");
    await rm("./dist/safari/background-safari");

    rem(
      "Creating ES6 module bundles with Rollup in dist/{chrome,firefox,safari}"
    );
    await exec("npx", ["rollup", "-c"]);
  },

  async build() {
    await this.compile();

    await this.bundle();

    rem(
      "Removing files compiled by the TypeScript compiler",
      "Keeping only files bundled by Rollup"
    );
    await rm("./dist/lib");
    await rm("./dist/src");
    await rm("./dist/chrome/*/");
    await rm("./dist/chrome/config.*");
    await rm("./dist/firefox/*/");
    await rm("./dist/firefox/config.*");
    await rm("./dist/safari/*/");
    await rm("./dist/safari/config.*");

    rem(
      "Setting up SOURCE_DATE_EPOCH for reproducible builds"
    );
    sourceDateEpoch = await getSourceDateEpoch();
    await write("./dist/chrome/SOURCE_DATE_EPOCH", sourceDateEpoch.epoch);
    await write("./dist/firefox/SOURCE_DATE_EPOCH", sourceDateEpoch.epoch);

    rem(
      "Copying icons"
    );
    await cp("./static/icons", "./dist/chrome/icons");
    await cp("./static/icons", "./dist/firefox/icons");
    await cp("./static/icons", "./dist/safari");

    rem(
      "Copying static pages to Firefox dist directory"
    );
    await cp("./static/_locales", "./dist/firefox/_locales");
    await cp("./static/views", "./dist/firefox/views");
    await cp("./node_modules/webextension-polyfill/dist/browser-polyfill.min.js", "./dist/firefox/views/browser-polyfill.min.js");

    rem(
      "Copying static pages to Chrome dist directory"
    );
    await cp("./static/views", "./dist/chrome/views");
    await cp("./node_modules/webextension-polyfill/dist/browser-polyfill.min.js", "./dist/chrome/views/browser-polyfill.min.js");

    rem(
      "Copying static pages to Safari dist directory"
    );
    await cp("./static/views", "./dist/safari/views");
    await cp("./node_modules/webextension-polyfill/dist/browser-polyfill.min.js", "./dist/safari/views/browser-polyfill.min.js");

    rem(
      "Setting up the Firefox manifest"
    );
    await cp("./static/firefox/manifest.json", "./dist/firefox/manifest.json");
    await replace("./dist/firefox/manifest.json", "{{package.version}}", manifestVersion);

    rem(
      "Setting up the Chrome manifest"
    );
    await cp("./static/chrome/manifest.json", "./dist/chrome/manifest.json");
    await replace("./dist/chrome/manifest.json", "{{package.version}}", manifestVersion);

    rem(
      "Setting up the Safari manifest"
    );
    await cp("./static/safari/manifest.json", "./dist/safari/manifest.json");
    await replace("./dist/safari/manifest.json", "{{package.version}}", manifestVersion);
  },

  async package() {
    rem(
      "Creating packages"
    );
    await zip("./dist/firefox", "./dist/firefox.zip", sourceDateEpoch.date);
    await zip("./dist/chrome", "./dist/chrome.zip", sourceDateEpoch.date);
  }
};

const args = process.argv.slice(2);

if (args.length) {
  args.forEach((target) => {
    if (!targets[target]) {
      console.error(`Invalid target ${target}. Valid targets: ${Object.keys(targets).join(", ")}`);
      process.exit(1);
    }
  });

  const startTime = new Date();

  args
  .map((target) => targets[target].bind(targets))
  .reduce((acc, curr) => acc.then(curr), Promise.resolve())
  .then(() => {
    const timeDiff        = new Date() - startTime;
    const timeDiffDisplay = (timeDiff < 1000) ? `${timeDiff}ms` : `${timeDiff / 1000}s`;

    rem(
      `Finished in ${ timeDiffDisplay }`
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(2);
  });
} else {
  console.error(`Missing target. Valid targets: ${Object.keys(targets).join(", ")}`);
  process.exit(1);
}
