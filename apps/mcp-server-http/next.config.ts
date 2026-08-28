import type { NextConfig } from "next";

// @csmf/mcp-server's package.json "exports" points at its *compiled*
// output (dist/create-server.js, built via `tsc` — see that package's
// "build" script), not raw TypeScript source, so no transpilePackages
// entry is needed here: it's consumed like any other prebuilt dependency.
//
// (An earlier version of this file pointed "exports" straight at the
// package's .ts source and used transpilePackages to pick it up — that
// broke under Turbopack: the package's own NodeNext-style relative
// imports use explicit ".js" extensions (required for `node dist/index.js`
// to run as native ESM), which Turbopack does not remap to the matching
// ".ts" files the way `tsc` does when resolving raw source directly.
// Consuming the compiled dist/ output sidesteps that mismatch entirely.)
const nextConfig: NextConfig = {};

export default nextConfig;
