'use client';
import { useEffect, useRef, useState } from 'react';

export function StatCounter({ target = 2325320 }: { target?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const dur = 1600;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <section className="section stat-section">
      <div className="container center">
        <h2 className="stat-title">Imposed by designers and print shops worldwide</h2>
        <div ref={ref} className="stat-frame">
          <span className="stat-corner tl" /><span className="stat-corner tr" />
          <span className="stat-corner bl" /><span className="stat-corner br" />
          <div className="stat-number">
            {n.toLocaleString('en-US')}
            <span className="stat-dot" />
          </div>
          <div className="stat-caption">PDFs imposed + tool usages</div>
        </div>
      </div>
    </section>
  );
}
