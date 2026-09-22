import { redirect } from 'next/navigation';

export default function RecoverRedirect() {
  redirect('/auth?tab=recover');
}