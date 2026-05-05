'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { PLAN_ID, PricingPlanList } from '@/utils/AppConfig';

export const Pricing = () => {
  const t = useTranslations('Pricing');
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check if current org already has an active subscription
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/billing/status')
      .then(r => r.json())
      .then(data => setIsSubscribed(data.isSubscribed))
      .catch(() => {});
  }, [isSignedIn]);

  function getPriceId(planId: string): string {
    const plan = PricingPlanList[planId];
    if (!plan) return '';
    return plan.devPriceId || plan.prodPriceId || '';
  }

  const handleCheckout = async (planId: string) => {
    const priceId = getPriceId(planId);

    if (!isSignedIn) {
      const signUpUrl = locale !== 'en' ? `/${locale}/sign-up` : '/sign-up';
      const returnUrl = `/dashboard/checkout?priceId=${priceId}`;
      router.push(`${signUpUrl}?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

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
        alert(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  // Paid plan button — shows "Manage Billing" if already subscribed
  const paidPlanButton = (planId: string) => {
    if (isSubscribed) {
      return (
        <button
          className={buttonVariants({ size: 'sm', className: 'mt-5 w-full' })}
          onClick={() => handleCheckout(planId)}
        >
          Manage Billing
        </button>
      );
    }

    return (
      <button
        className={buttonVariants({ size: 'sm', className: 'mt-5 w-full' })}
        onClick={() => handleCheckout(planId)}
      >
        {t('button_text')}
      </button>
    );
  };

  return (
    <Section
      subtitle={t('section_subtitle')}
      title={t('section_title')}
      description={t('section_description')}
    >
      <PricingInformation
        buttonList={{
          [PLAN_ID.FREE]: (
            <Link
              className={buttonVariants({ size: 'sm', className: 'mt-5 w-full' })}
              href="/sign-up"
            >
              {t('button_text')}
            </Link>
          ),
          [PLAN_ID.PREMIUM]: paidPlanButton(PLAN_ID.PREMIUM),
          [PLAN_ID.ENTERPRISE]: paidPlanButton(PLAN_ID.ENTERPRISE),
        }}
      />
    </Section>
  );
};
