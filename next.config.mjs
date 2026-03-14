/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.wishabi.net", pathname: "/**" },
      { protocol: "http", hostname: "**.wishabi.net", pathname: "/**" },
      { protocol: "https", hostname: "**.flippenterprise.net", pathname: "/**" },
      { protocol: "https", hostname: "images.wishabi.net", pathname: "/**" },
      { protocol: "https", hostname: "f.wishabi.net", pathname: "/**" },
      { protocol: "http", hostname: "f.wishabi.net", pathname: "/**" },
      { protocol: "http", hostname: "images.wishabi.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
