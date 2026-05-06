import { AUTH_PROVIDER } from '@/libs/auth-provider';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { AuthProviderSwitcher } from '@/features/admin/AuthProviderSwitcher';

type Provider = 'clerk' | 'authentik';

export default async function AuthProviderPage() {
  const currentProvider = (AUTH_PROVIDER ?? 'clerk') as Provider;

  return (
    <>
      <TitleBar
        title="Authentication Provider"
        description="Switch between Clerk and Authentik as your identity provider. Changes require a redeployment (~5 min)."
      />
      <div className="mx-6 mt-6 max-w-2xl">
        <AuthProviderSwitcher currentProvider={currentProvider} />
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
