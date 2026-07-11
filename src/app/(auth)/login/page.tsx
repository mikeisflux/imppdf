import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = { title: 'Sign in', robots: { index: false, follow: true } };

export default function LoginPage() {
  return <LoginForm />;
}
