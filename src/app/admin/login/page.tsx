import { redirect } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { LoginForm } from '@/components/forms/LoginForm';
import { getCurrentAdmin } from '@/lib/auth';

export const metadata = { title: 'Admin sign in' };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin');
  return (
    <div className="auth-wrap">
      <div className="auth-top"><Logo /></div>
      <div className="auth-card card">
        <LoginForm admin next="/admin" />
      </div>
    </div>
  );
}
