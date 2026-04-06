import { redirect } from 'next/navigation';

export default function AdminSettlementsRedirectPage() {
  redirect('/admin/requests?view=settlements');
}
