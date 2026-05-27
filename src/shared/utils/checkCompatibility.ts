// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import {
  IdentifierDiff,
  compareSemver,
  parseSemver,
} from "./semver";

import RequiresUpdate from "@web-eid.js/models/RequiresUpdate";
import Versions from "@web-eid.js/models/Versions";

/**
 * Checks if update is required.
 *
 * @param status Object containing SemVer version strings for library, extension and native app.
 *
 * @returns Object which specifies if the extension or native app should be updated.
 */
export default function checkCompatibility(versions: Versions): RequiresUpdate {
  const [
    librarySemver,
    extensionSemver,
    nativeAppSemver,
  ] = [
    parseSemver(versions.library),
    parseSemver(versions.extension),
    parseSemver(versions.nativeApp),
  ];

  return {
    extension: (
      compareSemver(extensionSemver, librarySemver).major === IdentifierDiff.OLDER
    ),

    nativeApp: (
      compareSemver(nativeAppSemver, librarySemver).major === IdentifierDiff.OLDER ||
      compareSemver(nativeAppSemver, extensionSemver).major === IdentifierDiff.OLDER
    ),
  };
}
