'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './Logo';
import { IconUpload, IconMenu } from './icons';

export interface HeaderUser {
  name: string | null;
  email: string;
  plan?: string;
}

const NAV = [
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Guide', href: '/guide' },
];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const [open, setOpen] = useState(false);
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="pp-header">
      <div className="container-wide pp-header-inner">
        <Logo />

        <nav className={`pp-nav ${open ? 'open' : ''}`}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="pp-header-right">
          <Link href="/app" className="btn btn-primary pp-upload-btn">
            <IconUpload width={16} height={16} /> Upload a File
          </Link>
          {user ? (
            <Link href="/account" className="pp-account" title={user.email}>
              <span className="pp-avatar">{initial}</span>
              <span className="pp-account-name">{user.name || user.email}</span>
            </Link>
          ) : (
            <Link href="/login" className="pp-signin">
              Sign in
            </Link>
          )}
          <button
            className="pp-menu-btn"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <IconMenu />
          </button>
        </div>
      </div>
    </header>
  );
}
