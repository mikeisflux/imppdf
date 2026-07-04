import { listContactMessages } from '@/lib/contact';
import { ContactsInbox } from '@/components/admin/ContactsInbox';

export const metadata = { title: 'Admin · Contact inbox' };
export const dynamic = 'force-dynamic';

export default function AdminContactsPage() {
  const messages = listContactMessages().map((m) => ({
    id: m.id, name: m.name, email: m.email, subject: m.subject, topic: m.topic,
    message: m.message, status: m.status, emailed: m.emailed, created_at: m.created_at,
  }));
  return (
    <div>
      <h1>Contact inbox</h1>
      <p className="admin-page-sub">
        {messages.length} messages. Every submission is emailed to you and stored here as a backup.
      </p>
      <ContactsInbox messages={messages} />
    </div>
  );
}
