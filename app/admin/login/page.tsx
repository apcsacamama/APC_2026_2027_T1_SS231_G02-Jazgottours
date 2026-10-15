import { redirect } from 'next/navigation';

// /admin/login is no longer used — all logins happen at /signin
export default function AdminLoginRedirect() {
  redirect('/signin');
}