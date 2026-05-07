/**
 * next-auth v5 configuration for the Authentik provider.
 * Only loaded when AUTH_PROVIDER=authentik.
 */

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';

import { db } from '@/libs/DB';
import {
  accountSchema,
  organizationMemberSchema,
  organizationSchema,
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

    async signIn({ user, profile }) {
      // T-005: Auto-create org on first Authentik login
      // T-008: Populate authentikId from profile.sub if missing
      try {
        if (!user.id) return true;

        // T-008: populate authentikId if missing
        if (profile?.sub) {
          const existingUser = await db
            .select()
            .from(userSchema)
            .where(eq(userSchema.id, user.id))
            .limit(1);

          if (existingUser[0] && !existingUser[0].authentikId) {
            await db
              .update(userSchema)
              .set({ authentikId: profile.sub as string })
              .where(eq(userSchema.id, user.id));
          }
        }

        // T-005: check if user already has an org
        const existingMembership = await db
          .select()
          .from(organizationMemberSchema)
          .where(eq(organizationMemberSchema.userId, user.id))
          .limit(1);

        if (existingMembership.length === 0) {
          // No org — create one, make user admin
          const orgId = crypto.randomUUID();
          const displayName = user.name ?? user.email?.split('@')[0] ?? 'My Org';
          const slug = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48)
            + '-' + orgId.slice(0, 8);

          await db.insert(organizationSchema).values({
            id: orgId,
            name: displayName,
            slug,
            updatedAt: new Date(),
            createdAt: new Date(),
          });

          await db.insert(organizationMemberSchema).values({
            id: crypto.randomUUID(),
            userId: user.id,
            orgId: orgId,
            role: 'admin',
          });
        }
      } catch (err) {
        // Never block sign-in due to org creation failure
        console.error('[auth-nextauth] signIn callback error:', err);
      }

      return true;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
