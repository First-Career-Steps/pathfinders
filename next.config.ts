import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    async redirects() {
        return [
            { source: '/workspace/resume-bullet', destination: '/workshops/resume-bullet', permanent: true },
            { source: '/learn/ai', destination: '/classes', permanent: true },
            { source: '/learn/ai/basics', destination: '/classes/ai-basics', permanent: true },
            { source: '/learn/ai/prompting', destination: '/classes/ai-basics', permanent: true },
            { source: '/learn/ai/brainstorming', destination: '/classes/ai-brainstorming', permanent: true },
            { source: '/learn/ai/multiple-ais', destination: '/classes/ai-multiple', permanent: true },
            { source: '/learn/ai/building', destination: '/classes/ai-building', permanent: true },
            { source: '/learn/ai/prompts', destination: '/classes/prompts', permanent: true },
        ];
    },
    outputFileTracingIncludes: { '/learn/\\[...course\\]': ['./education/*.html'] },
};

export default nextConfig;
