# Build Log

---

## 2026-05-07T12:05:02.241Z - Chat Agent - Smoke test root cause + fix

Root cause of smoke test never running:
- set-version succeeds for real code commit (e.g. bc7262a)
- Smoke test workflow_run event fires with concurrency group smoke-test-main (shared)
- Cron agent pushes ci: commit ~7 seconds later
- That ci: commit triggers another workflow_run on smoke-test.yml
- Even though skipped (conclusion != success), the shared concurrency group cancels the running smoke test
- Result: every real smoke test cancelled before completing

Fix (0d7c15e):
- Concurrency group changed to smoke-test-RUNID (unique per workflow_run)
- ci: skip events get their own group and cannot cancel a real running smoke test
- cancel-in-progress: false for additional safety

Verification: Run 25494601874 in_progress for 0d7c15e - smoke test running on the fix itself.

Observer 17/18 tests passing (aaf0ccc):
- Only E2 (smoke badge) failing - expected since badge is stale
- T-001 very close to full pass

Live SHA: b0a954f - Coolify shows a815e93 finished but live not updated yet.

TASK-E + TASK-F: Still pending Operator.