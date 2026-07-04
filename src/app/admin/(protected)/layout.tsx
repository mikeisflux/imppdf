import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { AdminLogout } from '@/components/admin/AdminLogout';
import { countNewContacts } from '@/lib/contact';

export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/admin/keys', label: 'API keys' },
  { href: '/admin/contacts', label: 'Contact inbox' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  const newContacts = countNewContacts();

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-side-top">
          <Logo size={22} />
          <span className="admin-tag">Admin</span>
        </div>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
              {n.href === '/admin/contacts' && newContacts > 0 && (
                <span className="admin-badge-count">{newContacts}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="admin-side-foot">
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{admin.email}</div>
          <Link href="/" className="admin-side-link">← Back to site</Link>
          <AdminLogout />
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
