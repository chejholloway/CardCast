/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /@opentelemetry\/instrumentation/,
          contextRegExp: /.*/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
