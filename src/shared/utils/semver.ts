// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import VersionInvalidError from "@web-eid.js/errors/VersionInvalidError";

const semverPattern = new RegExp(
  "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)" +
  "(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$"
);

export enum IdentifierDiff {
  NEWER = 1,
  SAME = 0,
  OLDER = -1,
}

interface Semver {
  major: number;
  minor: number;
  patch: number;
  rc?: string;
  build?: string;
  string: string;
}

/**
 * The difference can be -1, 0 or 1.
 */
interface SemverDiff {
  major: IdentifierDiff;
  minor: IdentifierDiff;
  patch: IdentifierDiff;
}

export function parseSemver(string = ""): Semver {
  const result = string.match(semverPattern);

  const [, majorStr, minorStr, patchStr, rc, build] = result ? result : [];

  const major = parseInt(majorStr, 10);
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);

  for (const indentifier of [major, minor, patch]) {
    if (Number.isNaN(indentifier)) {
      throw new VersionInvalidError(`Invalid SemVer string '${string}'`);
    }
  }

  return { major, minor, patch, rc, build, string };
}

/**
 * Compares two Semver objects.
 *
 * @param {Semver} a First SemVer object
 * @param {Semver} b Second Semver object
 *
 * @returns {SemverDiff} Diff for major, minor and patch.
 */
export function compareSemver(a: Semver, b: Semver): SemverDiff {
  return {
    major: Math.sign(a.major - b.major),
    minor: Math.sign(a.minor - b.minor),
    patch: Math.sign(a.patch - b.patch),
  };
}
