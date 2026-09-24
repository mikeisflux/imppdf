'use client';
import { useState } from 'react';
import { FAQ } from '@/lib/tools';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <div className="faq">
          <div className="faq-side">
            <div className="eyebrow">05 — Questions</div>
            <h2>The things people ask before they open it</h2>
            <p>Straight answers, from how the editor actually behaves. Anything else, the contact page reaches a person.</p>
          </div>
          <div className="faq-list">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button className="faq-q" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                    <span>{item.q}</span>
                    <span className="faq-plus" aria-hidden />
                  </button>
                  {isOpen && <div className="faq-a">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
