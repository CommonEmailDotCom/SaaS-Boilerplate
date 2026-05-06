import { getActiveProvider } from '@/libs/auth-provider';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { AuthProviderSwitcher } from '@/features/admin/AuthProviderSwitcher';

type Provider = 'clerk' | 'authentik';

export default async function AuthProviderPage() {
  const currentProvider = await getActiveProvider() as Provider;

  return (
    <>
      <TitleBar
        title="Authentication Provider"
        description="Switch between Clerk and Authentik instantly. No redeployment needed."
      />
      <div className="mx-6 mt-6 max-w-2xl">
        <AuthProviderSwitcher currentProvider={currentProvider} />
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';
