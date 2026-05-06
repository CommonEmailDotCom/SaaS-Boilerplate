import type { OrgPermission, OrgRole } from '@/types/Auth';

// Use type safe message keys with `next-intl`
type Messages = typeof import('../locales/en.json');

// eslint-disable-next-line ts/consistent-type-definitions
declare interface IntlMessages extends Messages {}

// Clerk authorization types — only used when AUTH_PROVIDER=clerk
// Kept here so Clerk's TypeScript types resolve correctly
declare global {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface ClerkAuthorization {
    permission: OrgPermission;
    role: OrgRole;
  }
}
