import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getCurrentUser } from '@/lib/auth';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader
        user={user ? { name: user.name, email: user.email, plan: user.plan } : null}
      />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
