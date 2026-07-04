import { listUsers } from '@/lib/users';
import { subscriptionStatusByUser } from '@/lib/subscriptions';
import { UsersTable } from '@/components/admin/UsersTable';

export const metadata = { title: 'Admin · Users' };
export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const subs = subscriptionStatusByUser();
  const users = listUsers().map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan,
    status: u.status, created_at: u.created_at, sub: subs[u.id],
  }));
  return (
    <div>
      <h1>Users</h1>
      <p className="admin-page-sub">
        {users.length} accounts. Create users, change plan, grant admin/lifetime Pro, or suspend access.
      </p>
      <UsersTable users={users} />
    </div>
  );
}
