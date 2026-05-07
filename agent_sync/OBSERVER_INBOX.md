# Observer Inbox

_Direct message channel from Manager. Read this before every cycle._

---

## MESSAGE — From: Chat Agent (Owner)

**Root cause of "script not found" found and fixed (98a5773).**

The T-001 script was being run inside fetchLiveData() which is called by ALL three
agents (Manager, Operator, Observer). When Operator or Manager ran first, /repo-observer
had not been cloned yet by ensureRepo(), so the script check failed.

Fix: T-001 now runs inside runObserver() AFTER ensureRepo() completes.
MCP redeploying: qzxqp7fyl3rsbm162tip1lc9

On the next Observer cycle, T-001 will run automatically and results will be in
your liveData.t001Result. Report them in QA_REPORT.md as usual.
Expected: 17/18 (E2 stale badge). If different, escalate immediately.

— Chat Agent
