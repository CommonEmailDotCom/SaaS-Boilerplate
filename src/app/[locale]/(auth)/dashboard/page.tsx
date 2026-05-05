import { getTranslations } from 'next-intl/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

import { MessageState } from '@/features/dashboard/MessageState';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = async () => {
  const t = await getTranslations('DashboardIndex');

  const { userId, orgId } = await auth();

  if (!userId) return null;

  // =========================
  // DEBUG OVERRIDE (IMPORTANT)
  // =========================
  // We hardcode a known-good DB row so we bypass Clerk org mapping issues
  const TEST_ORG_ID = 'f1bf4764-ad6e-410e-b69b-f5d6885619c7';

  // You can toggle between real vs test easily:
  const resolvedOrgId = TEST_ORG_ID;

  // =========================
  // DB QUERY (DRIZZLE)
  // =========================
  const org = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, resolvedOrgId))
    .limit(1)
    .then((rows) => rows[0]);

  // =========================
  // DERIVED STATE
  // =========================
  const subscriptionStatus =
    org?.stripeSubscriptionStatus ?? 'free';

  // =========================
  // DEBUG OUTPUT (SERVER LOG)
  // =========================
  console.log('[DASHBOARD DEBUG]', {
    userId,
    clerkOrgId: orgId,
    resolvedOrgId,
    orgFromDb: org,
    subscriptionStatus,
  });

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {/* DEBUG PANEL */}
      <div className="mx-6 mt-4 rounded-lg border bg-card p-4 text-sm">
        <div className="flex flex-col gap-1">
          <p>
            <span className="font-medium">User:</span> {userId}
          </p>

          <p>
            <span className="font-medium">Clerk Org ID:</span>{' '}
            {orgId ?? 'null'}
          </p>

          <p>
            <span className="font-medium">Resolved Org ID:</span>{' '}
            {resolvedOrgId}
          </p>

          <p>
            <span className="font-medium">Subscription:</span>{' '}
            {subscriptionStatus === 'free' ? (
              <span className="text-yellow-500">Free Plan</span>
            ) : (
              <span className="text-green-500">Active Plan</span>
            )}
          </p>
        </div>

        {/* RAW DB OUTPUT (VERY IMPORTANT FOR DEBUGGING) */}
        <div className="mt-4">
          <p className="font-medium mb-2">Raw DB Record:</p>
          <pre className="text-xs overflow-auto bg-muted p-2 rounded">
            {JSON.stringify(org, null, 2)}
          </pre>
        </div>
      </div>

      <MessageState
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M0 0h24v24H0z" stroke="none" />
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3M12 12l8-4.5M12 12v9M12 12L4 7.5" />
          </svg>
        }
        title={t('message_state_title')}
        description={t('message_state_description')}
        button={
          <div className="mt-2 text-sm text-muted-foreground">
            {t('message_state_alternative')}
          </div>
        }
      />
    </>
  );
};

export default DashboardIndexPage;
