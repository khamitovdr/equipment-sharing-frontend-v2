import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*/",
        destination: "https://api.equip-me.ru/api/:path*/",
      },
      {
        source: "/api/:path*",
        destination: "https://api.equip-me.ru/api/:path*",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
