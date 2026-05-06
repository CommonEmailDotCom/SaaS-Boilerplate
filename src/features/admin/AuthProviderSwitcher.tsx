'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Provider = 'clerk' | 'authentik';

type Props = {
  currentProvider: Provider;
};

const PROVIDER_INFO = {
  clerk: {
    name: 'Clerk',
    description: 'Hosted auth with pre-built UI, organizations, and user management.',
    features: ['Hosted sign-in / sign-up UI', 'Organization management', 'User profiles', '7-language localization'],
    color: 'bg-purple-500',
    docs: 'https://clerk.com/docs',
  },
  authentik: {
    name: 'Authentik',
    description: 'Self-hosted identity provider running on your own infrastructure.',
    features: ['Self-hosted on auth.joefuentes.me', 'OIDC / OAuth2 / SAML', 'Full data ownership', 'SSO for all your apps'],
    color: 'bg-blue-500',
    docs: 'https://docs.goauthentik.io',
  },
} as const;

export function AuthProviderSwitcher({ currentProvider }: Props) {
  const [selected, setSelected] = useState<Provider>(currentProvider);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const router = useRouter();

  const isDirty = selected !== currentProvider;

  async function handleSave() {
    if (!isDirty) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/auth-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selected }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        router.refresh();
      }
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current status */}
      <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm">
        <div className={`size-2.5 rounded-full ${PROVIDER_INFO[currentProvider].color}`} />
        <span className="text-muted-foreground">Currently active:</span>
        <span className="font-semibold">{PROVIDER_INFO[currentProvider].name}</span>
        {currentProvider === 'clerk'
          ? <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Hosted</span>
          : <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Self-hosted</span>}
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['clerk', 'authentik'] as Provider[]).map(provider => {
          const info = PROVIDER_INFO[provider];
          const isSelected = selected === provider;
          const isCurrent = currentProvider === provider;

          return (
            <button
              key={provider}
              onClick={() => setSelected(provider)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {isCurrent && (
                <span className="absolute right-3 top-3 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <div className={`size-3 rounded-full ${info.color}`} />
                <span className="text-lg font-semibold">{info.name}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{info.description}</p>
              <ul className="mt-3 space-y-1">
                {info.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <svg className="size-3.5 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Warning */}
      {isDirty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>⚠️ This will trigger a redeployment.</strong>
          {' '}Switching from <strong>{PROVIDER_INFO[currentProvider].name}</strong> to{' '}
          <strong>{PROVIDER_INFO[selected].name}</strong> takes ~5 minutes.
          Users will be signed out and need to sign in again with the new provider.
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg border p-4 text-sm ${
          result.success
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {result.success ? '✅ ' : '❌ '}
          {result.message ?? result.error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!isDirty || loading}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Switching...' : 'Switch Provider & Redeploy'}
      </button>
    </div>
  );
}
