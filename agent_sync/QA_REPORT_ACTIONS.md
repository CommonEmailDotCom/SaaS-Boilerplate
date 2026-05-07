# ❌ T-001 QA Report — Observer Agent

_SHA: ecd03fd | 2026-05-07T03:47:03.716Z_
_Claude API summary unavailable: Cannot read properties of undefined (reading '0')_

## Raw Playwright Output

```

Running 5 tests using 1 worker

[PASS] A1: /sign-in loaded
[PASS] A2: Google OAuth button visible in Clerk UI
[PASS] A3: Reached Google sign-in (redirect)

✅ QA_REPORT_ACTIONS.md written to agent_sync/
  ✘  1 [chromium] › auth.spec.ts:78:7 › Test A — Clerk baseline (Google OAuth) › sign in with Google through Clerk, dashboard loads (1.5m)
[PASS] B1: Redirected to auth.joefuentes.me ✓
[PASS] B2: PKCE S256 present in redirect chain
[PASS] B3: redirect_uri points back to cuttingedgechat.com/api/auth/callback/authentik
[PASS] B4: v4 route correctly returns error=Configuration (not the active flow)
[PASS] B5: /api/admin/auth-provider → 401 unauthenticated
  ✓  2 [chromium] › auth.spec.ts:131:7 › Test B — Authentik sign-in route › /api/auth/authentik-signin redirects to auth.joefuentes.me with PKCE (2.3s)
  -  3 [chromium] › auth.spec.ts:164:7 › Test C — Dashboard under Authentik session › sign in via Authentik Google OAuth, dashboard and billing load
  -  4 [chromium] › auth.spec.ts:216:7 › Test D — Switch Authentik → Clerk › switch back to Clerk from Authentik, sign in works
[PASS] E1: Badge endpoint reachable (HTTP 200)
[UX_SUGGESTION] E2: Smoke badge status: "smoke test: failing" — may be mid-deploy

✅ QA_REPORT_ACTIONS.md written to agent_sync/
  ✓  5 [chromium] › auth.spec.ts:259:7 › Test E — Smoke badge › smoke badge endpoint is reachable and reports status (365ms)


  1) [chromium] › auth.spec.ts:78:7 › Test A — Clerk baseline (Google OAuth) › sign in with Google through Clerk, dashboard loads 

    [31mTest timeout of 90000ms exceeded.[39m

    Error: locator.click: Test timeout of 90000ms exceeded.
    Call log:
      [2m- waiting for locator('#identifierNext button, [jsname="LgbsSe"]').first()[22m
    [2m  -   locator resolved to <button type="button" jsname="LgbsSe" jscontroller="soHxf" aria-label="Listen and type the numbers you hear" data-idom-class="ksBjEc lKxP2d LQeN7 BqKGqe eR0mzb TrZEUc lw1w4b" class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-Bz112c-M1Soyc VfPpkd-LgbsSe-OWXEXe-dgl2Hf ksBjEc lKxP2d LQeN7 BqKGqe eR0mzb TrZEUc lw1w4b" jsaction="click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc; touchcancel:JMtRjd; focus:AHmuwe; blur:O22p3e; con…>…</button>[22m
    [2m  - attempting click action[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #1[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #2[22m
    [2m  -   waiting 20ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #3[22m
    [2m  -   waiting 100ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #4[22m
    [2m  -   waiting 100ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #5[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #6[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #7[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #8[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #9[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #10[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #11[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #12[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #13[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #14[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #15[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #16[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #17[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #18[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #19[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #20[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #21[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #22[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #23[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #24[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #25[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #26[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #27[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #28[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #29[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #30[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #31[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #32[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #33[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #34[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #35[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #36[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #37[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #38[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #39[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #40[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #41[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #42[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #43[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #44[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #45[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #46[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #47[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #48[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #49[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #50[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #51[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #52[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #53[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #54[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #55[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #56[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #57[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #58[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #59[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #60[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #61[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #62[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #63[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #64[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #65[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #66[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #67[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #68[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #69[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #70[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #71[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #72[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #73[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #74[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #75[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #76[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #77[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #78[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #79[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #80[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #81[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #82[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #83[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #84[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #85[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #86[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #87[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #88[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #89[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #90[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #91[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #92[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #93[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #94[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #95[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #96[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #97[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #98[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #99[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #100[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #101[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #102[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #103[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #104[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #105[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #106[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #107[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #108[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #109[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #110[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #111[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #112[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #113[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #114[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #115[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #116[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #117[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #118[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #119[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #120[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #121[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #122[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #123[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #124[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #125[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #126[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #127[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #128[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #129[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #130[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #131[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #132[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #133[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #134[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #135[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #136[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #137[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #138[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #139[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #140[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #141[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #142[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #143[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #144[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #145[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #146[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #147[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #148[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #149[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #150[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #151[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #152[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #153[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #154[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #155[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #156[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #157[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #158[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #159[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #160[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #161[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #162[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #163[22m
    [2m  -   waiting 500ms[22m
    [2m  -   waiting for element to be visible, enabled and stable[22m
    [2m  -   element is not visible[22m
    [2m  - retrying click action, attempt #164[22m
    [2m  -   waiting 500ms[22m


      45 |   await page.waitForSelector('input[type="email"]:not([aria-hidden="true"])', { timeout: 15000 });
      46 |   await page.fill('input[type="email"]:not([aria-hidden="true"])', email);
    > 47 |   await page.locator('#identifierNext button, [jsname="LgbsSe"]').first().click();
         |                                                                           ^
      48 |   logFinding('PASS', `${label}: Gmail email submitted`);
      49 |
      50 |   // jsname="YPqjbf" is the visible password input — not the hidden duplicate

        at signInWithGoogle (/home/runner/work/SaaS-Boilerplate/SaaS-Boilerplate/tests/e2e/auth.spec.ts:47:75)
        at /home/runner/work/SaaS-Boilerplate/SaaS-Boilerplate/tests/e2e/auth.spec.ts:99:5

    attachment #1: video (video/webm) ──────────────────────────────────────────────────────────────
    test-results/auth-Test-A-—-Clerk-baseli-ea7ea-rough-Clerk-dashboard-loads-chromium/video.webm
    ────────────────────────────────────────────────────────────────────────────────────────────────

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/auth-Test-A-—-Clerk-baseli-ea7ea-rough-Clerk-dashboard-loads-chromium/trace.zip
    Usage:

        npx playwright show-trace test-results/auth-Test-A-—-Clerk-baseli-ea7ea-rough-Clerk-dashboard-loads-chromium/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

  1 failed
    [chromium] › auth.spec.ts:78:7 › Test A — Clerk baseline (Google OAuth) › sign in with Google through Clerk, dashboard loads 
  2 skipped
  2 passed (1.6m)

```
