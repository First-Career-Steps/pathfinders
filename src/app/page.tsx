import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WORKSHOP, WORKSHOP_PRODUCT_NOTE, WORKSHOP_AI_NOTICE } from '@/lib/workshop';
import styles from './home.module.css';

const paths = [
    { name: 'AI workshops', type: 'Interactive courses', body: 'Write a better prompt, compare AI tools and take an idea through to a tested feature.', detail: '4 workshops and an AI basics course', href: '/learn/ai', action: 'Explore AI', tone: 'blue' },
    { name: 'Leadership', type: 'Courses & assessments', body: 'Make a tough call on a restaurant shift or inside a finance team. See how your decision plays out.', detail: 'Restaurant and accounting tracks', href: '/learn/leadership', action: 'Explore Leadership', tone: 'green' },
    { name: 'Resume Builder', type: 'Career service', body: 'Turn your school, volunteer and work experience into a resume you can use.', detail: 'Free preview · PDF downloads $1.99/year', href: '/resume-builder', action: 'Build my resume', tone: 'gold' },
];

export default function HomePage() {
    return <><Header/><main className={styles.home}>
        <div className={styles.container}>
            <header className={styles.intro}>
                <p className={styles.kicker}>Workplace learning &amp; career tools</p>
                <h1>Build skills for your next step.</h1>
                <p>Choose a course, try a workplace decision, or put your experience on paper.</p>
            </header>
            <section className={styles.paths} aria-label="Choose your path">
                {paths.map(path => <article key={path.name} className={styles[path.tone]}>
                    <div className={styles.cardTop}><p>{path.type}</p><h2>{path.name}</h2></div>
                    <div className={styles.cardBody}><p>{path.body}</p><small>{path.detail}</small>
                        <a className={styles.cardLink} href={path.href}>{path.action}</a>
                    </div>
                </article>)}
            </section>
            <section className={styles.practice} aria-labelledby="practice-title">
                <div className={styles.sectionHead}><h2 id="practice-title">Try a free exercise</h2><Link href="/learn">View all courses</Link></div>
                <div className={styles.examples}>
                    <article className={styles.feature}>
                        <Image src="/learning-assets/lead-the-shift.webp" alt="A shift lead coaching a teammate at the pizza pass" width={320} height={220}/>
                        <div><p className={styles.kicker}>Restaurant leadership</p><h3>Two cooks start the same remake.</h3><p>Four guests are waiting. What do you do in the next 30 seconds?</p>
                            {/* Course players open as standalone HTML documents. */}
                            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                            <a href="/learn/leadership/restaurant#case">Try the shift decision</a></div>
                    </article>
                    <article className={styles.student}>
                        <p className={styles.kicker}>Resume bullet workshop</p><h3>Write a resume bullet you can defend.</h3>
                        <p>{WORKSHOP_PRODUCT_NOTE}</p><p>{WORKSHOP_AI_NOTICE}</p>
                        <Link href={WORKSHOP + '#free-example'}>Try the free workshop exercise</Link>
                    </article>
                </div>
            </section>
        </div>
    </main><Footer/></>;
}
