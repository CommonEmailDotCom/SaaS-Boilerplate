'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  // Use BILLING_PLAN_ENV on server, fall back to devPriceId on client.
  // When you have separate prod price IDs, add NEXT_PUBLIC_BILLING_ENV=prod to Coolify.
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
              className={buttonVariants({
                size: 'sm',
                className: 'mt-5 w-full',
              })}
              href="/sign-up"
            >
              {t('button_text')}
            </Link>
          ),

          [PLAN_ID.PREMIUM]: (
            <button
              className={buttonVariants({
                size: 'sm',
                className: 'mt-5 w-full',
              })}
              onClick={() => handleCheckout(PLAN_ID.PREMIUM)}
            >
              {t('button_text')}
            </button>
          ),

          [PLAN_ID.ENTERPRISE]: (
            <button
              className={buttonVariants({
                size: 'sm',
                className: 'mt-5 w-full',
              })}
              onClick={() => handleCheckout(PLAN_ID.ENTERPRISE)}
            >
              {t('button_text')}
            </button>
          ),
        }}
      />
    </Section>
  );
};
