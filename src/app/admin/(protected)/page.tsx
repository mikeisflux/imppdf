import Link from 'next/link';
import { listUsers } from '@/lib/users';
import { listSubscriptions } from '@/lib/subscriptions';
import { listContactMessages } from '@/lib/contact';
import { usageTotals } from '@/lib/usage';

export const metadata = { title: 'Admin · Dashboard' };
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const users = listUsers();
  const subs = listSubscriptions();
  const contacts = listContactMessages();
  const totals = usageTotals();

  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const activeSubs = subs.filter((s) => s.status === 'ACTIVE').length;
  const newContacts = contacts.filter((c) => c.status === 'new').length;

  const cards = [
    { n: users.length, l: 'Total users' },
    { n: proUsers, l: 'Pro users' },
    { n: activeSubs, l: 'Active subscriptions' },
    { n: totals.downloads, l: 'Downloads recorded' },
    { n: newContacts, l: 'New messages' },
    { n: contacts.length, l: 'Total messages' },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="admin-page-sub">Overview of accounts, subscriptions and usage.</p>

      <div className="stat-cards">
        {cards.map((c) => (
          <div key={c.l} className="card stat-card">
            <div className="n">{c.n.toLocaleString()}</div>
            <div className="l">{c.l}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Recent signups</h2>
        <table className="admin-table">
          <thead><tr><th>Email</th><th>Plan</th><th>Joined</th></tr></thead>
          <tbody>
            {users.slice(0, 6).map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td><span className={`badge ${u.plan === 'pro' ? 'badge-brand' : 'badge-gray'}`}>{u.plan}</span></td>
                <td className="muted">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={3} className="muted">No users yet.</td></tr>}
          </tbody>
        </table>
        <Link href="/admin/users" className="link-arrow" style={{ marginTop: 14, display: 'inline-flex' }}>Manage users →</Link>
      </div>
    </div>
  );
}
