import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './home.module.css';

const paths = [
    {name:'AI workshops', type:'Interactive courses', body:'Take an idea from a rough prompt to a tested feature. Save a workbook you can use on your next project.', href:'/learn/ai', action:'Explore AI', color:'blue'},
    {name:'Leadership', type:'Courses & assessments', body:'Practice a tough call on a restaurant shift or inside a finance team. See what changes when you choose a different response.', href:'/learn/leadership', action:'Explore Leadership', color:'green'},
    {name:'Resume Builder', type:'Career service', body:'Turn school, volunteer and work experience into a resume. Preview it free. PDF downloads are $1.99 per year, billed annually.', href:'/resume-builder', action:'Build my resume', color:'gold'},
];

export default function HomePage() {
    return <><Header/><main className={styles.home}>
        <section className={styles.hero}>
            <div className={styles.heroInner}>
                <div><p className={styles.kicker}>First Career Steps · Workplace learning</p>
                    <h1>Build skills for<br/>your <em>next step.</em></h1>
                    <p className={styles.intro}>Try a real workplace decision, practice with AI, or build a resume from what you’ve already done.</p>
                    <a href="#paths" className={styles.primary}>Choose your path <span aria-hidden="true">↓</span></a>
                </div>
                <div className={styles.feature}>
                    <Image src="/learning-assets/lead-the-shift.webp" alt="A shift lead and teammate at the restaurant pass" width={640} height={340} priority/>
                    <div className={styles.caption}><p className={styles.kicker}>Try a leadership case</p><h2>Two cooks start the same remake. Four guests are waiting.</h2>
                    {/* The course player serves a complete interactive HTML document. */}
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a href="/learn/leadership/restaurant#case">What do you do in the next 30 seconds? <span aria-hidden="true">→</span></a></div>
                </div>
            </div>
        </section>
        <section className={styles.section} id="paths" aria-labelledby="paths-title"><h2 id="paths-title">Choose your path</h2>
            <div className={styles.cards}>{paths.map(path=><article key={path.name} className={styles[path.color]}>
                <p className={styles.kicker}>{path.type}</p><h3>{path.name}</h3><p>{path.body}</p><a href={path.href}>{path.action} <span aria-hidden="true">→</span></a>
            </article>)}</div>
        </section>
        <section className={styles.workshop}><div><p className={styles.kicker}>Student workshop · About 20 minutes</p>
            <h2>Write a resume bullet you can defend.</h2><p>Turn something you actually did into a resume bullet and an interview answer. Try the free example or take the full $4.99 workshop.</p></div>
            <Link href="/workshops/resume-bullet" className={styles.secondary}>Try the free example <span aria-hidden="true">→</span></Link></section>
    </main><Footer/></>;
}
