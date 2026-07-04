'use client';
import { useRouter } from 'next/navigation';

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      className="admin-side-link"
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
