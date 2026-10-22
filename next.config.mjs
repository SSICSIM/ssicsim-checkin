import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Next from treating a lockfile higher up as the workspace root.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url))
};

export default nextConfig;
