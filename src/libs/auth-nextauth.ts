/**
 * next-auth v5 configuration for the Authentik provider.
 * Only loaded when AUTH_PROVIDER=authentik.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';

import { db } from '@/libs/DB';
import {
  accountSchema,
  sessionSchema,
  userSchema,
  verificationTokenSchema,
} from '@/models/Schema';

export const {
  handlers: authentikHandlers,
  auth: authentikAuth,
  signIn: authentikSignIn,
  signOut: authentikSignOut,
} = NextAuth({
  // Required in next-auth v5 when running behind a reverse proxy (Traefik/Coolify).
  // Without this, next-auth rejects requests as UntrustedHost.
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: userSchema as any,
    accountsTable: accountSchema as any,
    sessionsTable: sessionSchema as any,
    verificationTokensTable: verificationTokenSchema as any,
  }),
  providers: [
    {
      id: 'authentik',
      name: 'Authentik',
      type: 'oidc',
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      authorization: { params: { scope: 'openid email profile' } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email,
          image: profile.picture ?? null,
        };
      },
    },
  ],
  session: { strategy: 'database' },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
