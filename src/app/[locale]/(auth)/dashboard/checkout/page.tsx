'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This page is the post-signup landing page when a user clicked a paid plan.
// It auto-triggers Stripe checkout using the priceId passed in the URL.
// Flow: Pricing page → sign-up → /dashboard/checkout?priceId=xxx → Stripe → dashboard

const CheckoutRedirectPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId');

  useEffect(() => {
    if (!priceId) {
      router.replace('/dashboard');
      return;
    }

    const startCheckout = async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId }),
        });

        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('Checkout error:', data.error);
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Checkout failed:', err);
        router.replace('/dashboard');
      }
    };

    startCheckout();
  }, [priceId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Setting up your subscription...</p>
      </div>
    </div>
  );
};

export default CheckoutRedirectPage;
