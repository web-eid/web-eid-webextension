import { spawn } from "child_process";
import path from "path";

import fs from "fs-extra"
import archiver from "archiver";
import glob from 'glob';

const isWindows = /^win/.test(process.platform);

export const pkg = JSON.parse(fs.readFileSync("./package.json", 'utf8'));

export function rem(...lines) {
  console.log("\n###");
  if (lines.length) {
    lines.forEach((line) => {
      console.log("# " + line);
    });
  }
  console.log("###");
}

export function cp(source, destination) {
  console.log(`COPY ${source} → ${destination}`);

  return fs.copy(source, destination);
}

export async function rm(globPattern) {
  console.log(`REMOVE ${globPattern}`);

  const files = await findFiles(globPattern);

  return await Promise.all(
    files.map((file) => fs.remove(file))
  );
}

export function exec(command, args = []) {
  console.log(`EXEC ${command}${args.length ? ' ' + args.join(" ") : ''}`);
  
  if (isWindows && command.toLowerCase() === "npx") {
    command += ".cmd";
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on("close", (code) => {
      if (code == 0) {
        resolve();
      } else {
        reject(new Error(`exec(${JSON.stringify(command)}, ${JSON.stringify(args)}) failed with error code ${code}`));
      }
    });
  });
}

export async function zip(source, destination, date) {
  console.log(`ZIP ${source} → ${destination}`);

  const files = (await findFiles(source + "/**")).filter((location) => fs.lstatSync(location).isFile());

  return await new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(path.resolve(destination));
    const archive = archiver("zip");

    output.on("close", function() {
      resolve();
    });

    archive.on("error", function (error) {
      reject(error);
    });

    archive.pipe(output);

    files.forEach((file) => {
      archive.append(fs.createReadStream(file), { name: path.relative(source, file), date });
    });

    archive.finalize();
  });
}

export function replace(filename, from, to) {
  console.log(`REPLACE "${from}" → "${to}" in ${filename}`);

  return new Promise((resolve, reject) => {
    try {
      const data   = fs.readFileSync(path.resolve(filename), 'utf8');
      const result = data.replace(from, to);

      fs.writeFileSync(filename, result);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export function findFiles(globPattern) {
  return new Promise((resolve, reject) => {
    glob(globPattern, (error, matches) => {
      if (error) {
        reject(error);
      } else {
        resolve(matches);
      }
    });
  });
}

export async function getSourceDateEpoch() {
  const isDefined = !!process.env.SOURCE_DATE_EPOCH;
  const now       = new Date();
  const epoch     = process.env.SOURCE_DATE_EPOCH || Math.floor(now.getTime() / 1000).toString();
  const date      = new Date(epoch * 1000);

  if (isDefined) {
    console.log(`SOURCE_DATE_EPOCH=${process.env.SOURCE_DATE_EPOCH} # ${date.toString()}`);
  } else {
    console.warn("WARN SOURCE_DATE_EPOCH not set!");
    console.warn(`WARN using current time ${date.toString()}`);
    console.warn("WARN For a reproducible build, please set the SOURCE_DATE_EPOCH environment variable.");
    console.warn("WARN See README.md for details.\n");

    // Pause for 3 seconds, to make noticing the warning easier.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return {
    date,
    epoch
  };
}

export async function write(filename, data) {
  console.log(`WRITE ${data} → ${filename}`);

  await fs.writeFile(filename, data);
}
