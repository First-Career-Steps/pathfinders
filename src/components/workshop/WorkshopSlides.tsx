'use client';

import { createElement, type ReactNode } from 'react';
import Script from 'next/script';

type Slide = {title:string; body:string; example?:string};

export default function WorkshopSlides({title,slides,children}:{title:string;slides:Slide[];children:ReactNode}) {
    return <>
        <Script type="module" src="/learning-assets/slides.js" strategy="afterInteractive"/>
        {createElement('fcs-slide-deck', {'aria-label':title},
            ...slides.map(slide=><section data-slide="" key={slide.title}>
                <h2>{slide.title}</h2><p>{slide.body}</p>
                {slide.example && <div className="slide-example"><strong>Worked example</strong>{slide.example}</div>}
            </section>),
            <section data-check="" key="questions">{children}</section>
        )}
    </>;
}
