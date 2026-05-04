'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { PricingInformation } from '@/features/billing/PricingInformation';
import { Section } from '@/features/landing/Section';
import { PLAN_ID } from '@/utils/AppConfig';

export const Pricing = () => {
  const t = useTranslations('Pricing');

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
          onClick={async () => {
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
    });

    const text = await res.text();
    console.log('RAW RESPONSE:', text);

    const data = JSON.parse(text);

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('No URL returned');
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong');
  }
}}
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
          onClick={async () => {
  alert('CLICKED');

  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
    });

    alert('STATUS: ' + res.status);

    const text = await res.text();
    alert('RESPONSE: ' + text);

  } catch (err) {
    alert('ERROR: ' + String(err));
  }
}}
        >
          {t('button_text')}
        </button>
      ),
    }}
  />
</Section>
  );
};
