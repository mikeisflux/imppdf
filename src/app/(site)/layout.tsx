import '@/components/site/site.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getCurrentUser } from '@/lib/auth';

// The marketing site is the PAPER theme: every token is re-declared on this
// wrapper, so the editor, admin and auth screens outside it keep their own
// dark chrome untouched.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="site-paper">
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader
        user={user ? { name: user.name, email: user.email, plan: user.plan } : null}
      />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
