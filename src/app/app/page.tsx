import { AppWorkspace } from '@/components/app/AppWorkspace';

export const metadata = {
  title: 'Impose a PDF — the app',
  description:
    'Impose PDFs in your browser: booklets, N-up, step & repeat, cards, gang sheets, marks and bleed. Files never leave your device.',
};

// The imposition app is fully client-side; render the workspace shell.
export default function AppPage() {
  return <AppWorkspace />;
}
