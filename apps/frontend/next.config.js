/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@epicgames-ps/lib-pixelstreamingfrontend-ue5.7', '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.7'],
};

module.exports = nextConfig;
