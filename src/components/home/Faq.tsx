'use client';
import { useState } from 'react';
import { FAQ } from '@/lib/tools';
import { IconChevron } from '@/components/icons';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section faq-section" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="pill-badge">✦ FAQ</span>
          <h2 style={{ marginTop: 16 }}>Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                  <span>{item.q}</span>
                  <IconChevron width={18} height={18} className="faq-chevron" />
                </button>
                {isOpen && <div className="faq-a">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
