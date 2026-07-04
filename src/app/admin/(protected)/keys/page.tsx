import { listAllApiKeys } from '@/lib/apikeys';
import { KeysTable } from '@/components/admin/KeysTable';

export const metadata = { title: 'Admin · API keys' };
export const dynamic = 'force-dynamic';

export default function AdminKeysPage() {
  const keys = listAllApiKeys().map((k) => ({
    id: k.id, email: k.email, name: k.name, prefix: k.prefix, last4: k.last4,
    status: k.status, request_count: k.request_count, last_used_at: k.last_used_at, created_at: k.created_at,
  }));
  return (
    <div>
      <h1>API keys</h1>
      <p className="admin-page-sub">{keys.length} keys across all accounts.</p>
      <div className="card card-pad" style={{ overflowX: 'auto' }}>
        <KeysTable keys={keys} />
      </div>
    </div>
  );
}
