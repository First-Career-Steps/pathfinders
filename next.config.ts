import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async redirects() {
        return [{ source: '/workspace/resume-bullet', destination: '/workshops/resume-bullet', permanent: true }];
    },
    outputFileTracingIncludes: { '/learn/\\[...course\\]': ['./education/*.html'] },
};

export default nextConfig;
