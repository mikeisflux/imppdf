import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export const metadata = { title: 'Forgot password', robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
