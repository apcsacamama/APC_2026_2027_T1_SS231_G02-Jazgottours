import { redirect } from 'next/navigation';

// /admin/signin is no longer used — all logins happen at /signin
export default function AdminSignInRedirectPage() {
  redirect('/signin');
}
