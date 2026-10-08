import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export const metadata = { title: 'Reset password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <ResetPasswordForm token={token} />;
}
