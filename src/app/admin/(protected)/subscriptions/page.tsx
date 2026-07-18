import { listSubscriptions } from '@/lib/subscriptions';
import { SubscriptionsReconcile } from '@/components/admin/SubscriptionsReconcile';

export const metadata = { title: 'Admin · Subscriptions' };
export const dynamic = 'force-dynamic';

function statusBadge(s: string) {
  if (s === 'ACTIVE') return 'badge-green';
  if (s === 'CANCELLED' || s === 'EXPIRED' || s === 'SUSPENDED') return 'badge-red';
  return 'badge-gray';
}

export default function AdminSubscriptionsPage() {
  const subs = listSubscriptions();
  return (
    <div>
      <h1>Subscriptions</h1>
      <p className="admin-page-sub">{subs.length} subscription records synced from PayPal.</p>
      <SubscriptionsReconcile />
      <div className="card card-pad" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Plan</th><th>PayPal ID</th><th>Cycle</th><th>Status</th><th>Renews / ends</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td><span className={`badge ${s.plan === 'pro' ? 'badge-green' : 'badge-gray'}`}>{s.plan}</span></td>
                <td className="key-mono">{s.paypal_subscription_id || '—'}</td>
                <td style={{ textTransform: 'capitalize' }}>{s.billing_cycle || '—'}</td>
                <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                <td className="muted">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}</td>
                <td className="muted">{new Date(s.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={7} className="muted">No subscriptions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
