import { Suspense } from 'react';
import { AppWorkspace } from '@/components/app/AppWorkspace';

export const metadata = {
  title: 'Impose a PDF — the app',
  description:
    'Impose PDFs in your browser: booklets, N-up, step & repeat, cards, gang sheets, marks and bleed. Files never leave your device.',
};

// The imposition app is fully client-side; render the workspace shell.
// Suspense boundary is required because AppWorkspace reads the ?tool= param
// via useSearchParams to deep-link into a specific tool.
export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <AppWorkspace />
    </Suspense>
  );
}
