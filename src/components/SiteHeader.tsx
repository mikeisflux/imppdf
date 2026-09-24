'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './Logo';
import { ShareButton } from './ShareButton';
import { IconArrow, IconMenu } from './icons';

export interface HeaderUser {
  name: string | null;
  email: string;
  plan?: string;
}

const NAV = [
  { label: 'Tools', href: '/#gallery' },
  { label: 'Guides', href: '/guide' },
  { label: 'Compare', href: '/compare' },
  { label: 'Pricing', href: '/pricing' },
];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const [open, setOpen] = useState(false);
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="pp-header">
      <div className="container-wide pp-header-inner">
        <Logo />

        <nav className={`pp-nav ${open ? 'open' : ''}`} aria-label="Site">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="pp-header-right">
          <span className="pp-share-wrap"><ShareButton /></span>
          {user ? (
            <Link href="/account" className="pp-account" title={user.email}>
              <span className="pp-avatar">{initial}</span>
              <span className="pp-account-name">{user.name || user.email}</span>
            </Link>
          ) : (
            <Link href="/login" className="pp-signin">Sign in</Link>
          )}
          <Link href="/app" className="btn btn-ink pp-upload-btn">
            Open the editor <IconArrow width={15} height={15} />
          </Link>
          <button
            className="pp-menu-btn"
            aria-label={open ? 'Close menu' : 'Menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <IconMenu />
          </button>
        </div>
      </div>
    </header>
  );
}
