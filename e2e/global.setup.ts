import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

// Must run serially — required when Playwright is configured for parallel execution
setup.describe.configure({ mode: 'serial' });

setup('global setup', async () => {
  // Fetches a Clerk Testing Token using CLERK_SECRET_KEY and sets CLERK_TESTING_TOKEN
  // and CLERK_FAPI env vars for all test workers.
  // Requires: CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY env vars.
  await clerkSetup();
});
