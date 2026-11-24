import Link from 'next/link';

export default function LearningTrail({ topic, href, current }: { topic?: string; href?: string; current: string }) {
    return <div className="fcs-context"><div className="fcs-context-inner">
        <nav className="fcs-crumbs" aria-label="Breadcrumb"><ol>
            <li><Link href="/learn">Courses</Link></li>
            {topic && href && <li><Link href={href}>{topic}</Link></li>}
            <li aria-current="page">{current}</li>
        </ol></nav>
    </div></div>;
}
