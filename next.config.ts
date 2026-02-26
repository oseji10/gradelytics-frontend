// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
  
//   /* config options here */
//   webpack(config) {
//     config.module.rules.push({
//       test: /\.svg$/,
//       use: ["@svgr/webpack"],
//     });
//     return config;
//   },
    
//     turbopack: {
//       rules: {
//         '*.svg': {
//           loaders: ['@svgr/webpack'],
//           as: '*.js',
//         },
//       },
//       // root: "/home/oseji10/Documents/MyApps/click_invoice/app",  // Path to your app's folder (where the Next.js package.json is)
//       root: __dirname, 
//     },

//     output: 'export',

//   trailingSlash: true,

//   typescript: {
//     ignoreBuildErrors: true,
//   },

//   images: {
//     unoptimized: true,
//   },
  
// };

// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
// });

// module.exports = withPWA({
//   reactStrictMode: true,

//   // 👇 THIS FIXES THE ERROR
//   turbopack: {},
// });


// export default nextConfig;

import type { NextConfig } from "next";
import withPWA from "next-pwa";

const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true }, // Remove later when fixed
  turbopack: { root: __dirname },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default withPWA(pwaConfig)(nextConfig);