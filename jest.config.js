// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

module.exports = {
  preset:           "ts-jest",
  testEnvironment:  "node",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/../" }),
};
