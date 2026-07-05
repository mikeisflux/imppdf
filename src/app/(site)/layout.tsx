import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getCurrentUser } from '@/lib/auth';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader
        user={user ? { name: user.name, email: user.email, plan: user.plan } : null}
      />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
