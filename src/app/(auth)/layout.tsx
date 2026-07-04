import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect('/account');
  return (
    <div className="auth-wrap">
      <div className="auth-top"><Logo /></div>
      <div className="auth-card card">{children}</div>
      <div className="auth-foot muted">
        <Link href="/">← Back to PDF Press</Link>
      </div>
    </div>
  );
}
