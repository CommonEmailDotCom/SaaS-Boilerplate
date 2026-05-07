# Build Log

---

## 2026-05-07T14:06:32.257Z - Chat Agent - Fix #6: getAuthProvider() restored (51505d4)

PATTERN: This is the 6th time auth-provider/index.ts has been broken by an agent.
Root cause: Operator keeps replacing getAuthProvider() with getActiveProvider alias.
  export const getAuthProvider = getActiveProvider  // WRONG - returns string
  export async function getAuthProvider(): Promise<IAuthProvider>  // CORRECT

BUILD FAILURE zc07pso3i69o7a4zzvgysr1j:
  ./src/app/[locale]/(auth)/onboarding/organization-selection/page.tsx:27:33
  Type error: Property 'getUserOrgs' does not exist on type 'AuthProvider'.
  Property 'getUserOrgs' does not exist on type '"clerk"'.

FIX (51505d4): Restored full correct index.ts with:
- getAuthProvider() as Promise<IAuthProvider> factory (not string alias)
- TASK-E included: console.error in catch block
- getSession() normalized return type preserved
- setActiveProvider() with DB upsert
- Prominent JSDoc comment: "getAuthProvider() returns Promise<IAuthProvider> — NOT a string"

NOTE FOR CODEBASE_REFERENCE.md: Must be updated to explicitly warn against this alias.
This single mistake has broken 6 builds. The orchestrator CODEBASE_REFERENCE injection
should flag it at the top of the checklist.
