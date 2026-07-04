import { SETTING_GROUPS, adminView } from '@/lib/settings';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const metadata = { title: 'Admin · Settings' };
export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  const view = adminView();
  return (
    <div>
      <h1>Settings</h1>
      <p className="admin-page-sub">
        API keys and configuration. Changes are stored in the database and take effect
        immediately — no rebuild needed. Secret fields show “configured” once set; leave them
        blank to keep the existing value.
      </p>
      <SettingsForm groups={SETTING_GROUPS} view={view} />
    </div>
  );
}
