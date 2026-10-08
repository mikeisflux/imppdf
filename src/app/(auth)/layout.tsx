import '@/components/site/site.css';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Sign-in, sign-up and the password-reset pages wear the site's paper theme.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect('/account');
  return (
    <div className="site-paper auth-wrap">
      <div className="auth-top"><Logo /></div>
      <div className="auth-card card">{children}</div>
      <div className="auth-foot muted">
        <Link href="/">← Back to ImpositionPDF</Link>
      </div>
    </div>
  );
}
