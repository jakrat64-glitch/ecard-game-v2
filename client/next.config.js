/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the Docker deployment (see client/Dockerfile) — produces a
  // self-contained .next/standalone directory with only the files needed
  // to run the app, so the runtime image doesn't need the full node_modules
  // tree or source files copied in.
  output: "standalone",
};

module.exports = nextConfig;
