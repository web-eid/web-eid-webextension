/*
 * Copyright (c) 2020-2022 Estonian Information System Authority
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
