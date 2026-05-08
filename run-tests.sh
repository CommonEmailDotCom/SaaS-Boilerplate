#!/bin/sh
cd /repo-manager
export CLERK_SECRET_KEY=$(cat /tmp/clerk-key.txt)
export CLERK_PUBLISHABLE_KEY=pk_test_c21hc2hpbmctYmlzb24tNzIuY2xlcmsuYWNjb3VudHMuZGV2JA
export QA_GMAIL_EMAIL=testercuttingedgechat@gmail.com
export AUTHENTIK_TEST_USERNAME=testercuttingedgechat
export AUTHENTIK_TEST_PASSWORD=Hbj6ZVk5fHXhstz
export PG_CONNECTION_STRING=$PG_CONNECTION_STRING
npx playwright test e2e/t001-auth.spec.ts --config=playwright.local.config.ts --project=chromium > /tmp/pw-out.txt 2>&1
echo "EXIT:$?" >> /tmp/pw-out.txt
