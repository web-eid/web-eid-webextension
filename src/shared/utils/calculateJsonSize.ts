// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

/**
 * Calculates the size of an object's JSON representation in bytes
 *
 * @param object Any JSON stringifyable object
 *
 * @returns Size in bytes
 */
export default function calculateJsonSize(object: any): number {
  const objectString = JSON.stringify(object);
  const objectStringBlob = new Blob([objectString]);

  return objectStringBlob.size;
}
