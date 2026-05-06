/**
 * Triggers the Authentik OAuth flow via next-auth v5.
 * next-auth v5 signin must be initiated server-side via signIn(),
 * not by navigating to /api/auth/signin/authentik (that's v4 syntax).
 */
import { redirect } from 'next/navigation';
import { authentikSignIn } from '@/libs/auth-nextauth';

export async function GET() {
  await authentikSignIn('authentik', { redirectTo: '/dashboard' });
  // authentikSignIn throws a redirect internally, this line never runs
  redirect('/dashboard');
}
