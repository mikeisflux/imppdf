'use client';
import { useState } from 'react';
import { REVIEWS } from '@/lib/tools';
import { IconStar, IconChevron } from '@/components/icons';

const AVATAR_COLORS = ['#7c5cff', '#f59e0b', '#22c55e', '#3fc8ff', '#ff5ca8', '#a855f7', '#ef4444', '#8b5cf6', '#f97316'];

function Stars({ n }: { n: number }) {
  return (
    <div className="review-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} width={15} height={15} filled={i < n} color={i < n ? '#f5b301' : '#3a3a44'} />
      ))}
    </div>
  );
}

export function Reviews() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? REVIEWS : REVIEWS.slice(0, 6);

  return (
    <section className="section reviews-section">
      <div className="container">
        <div className="section-head">
          <span className="pill-badge">✦ Reviews</span>
          <h2 style={{ marginTop: 16 }}>Loved by prepress and print teams</h2>
          <p>
            Designers, copy centres and print shops who moved to PDF Press from Quite
            Imposing, pdfsnake, Imposition Wizard and other desktop imposers.
          </p>
          <div className="reviews-agg">
            <Stars n={5} /> <strong>4.8</strong> <span className="muted">/5 · 21 reviews</span>
          </div>
        </div>

        <div className="reviews-grid">
          {shown.map((r, i) => (
            <div key={i} className="review-card card card-pad">
              <Stars n={r.stars} />
              <p className="review-body">{r.body}</p>
              <div className="review-author">
                <span className="review-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {r.name.charAt(0)}
                </span>
                <div>
                  <div className="review-name">{r.name}</div>
                  <div className="review-role muted">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {REVIEWS.length > 6 && (
          <div className="center" style={{ marginTop: 34 }}>
            <button className="btn btn-ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer reviews' : 'Show more reviews'} <IconChevron width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
