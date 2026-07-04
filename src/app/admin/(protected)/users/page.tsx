import { listUsers } from '@/lib/users';
import { UsersTable } from '@/components/admin/UsersTable';

export const metadata = { title: 'Admin · Users' };
export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  const users = listUsers().map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan,
    status: u.status, created_at: u.created_at,
  }));
  return (
    <div>
      <h1>Users</h1>
      <p className="admin-page-sub">{users.length} accounts. Change plan, grant admin, or suspend access.</p>
      <div className="card card-pad" style={{ overflowX: 'auto' }}>
        <UsersTable users={users} />
      </div>
    </div>
  );
}
