import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    outputFileTracingIncludes: { '/learn/\\[...course\\]': ['./education/*.html'] },
};

export default nextConfig;
