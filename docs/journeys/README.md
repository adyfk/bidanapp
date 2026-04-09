# Journeys

Journey handbook sekarang memakai **Playwright-only visual proof**. Surface review utamanya adalah HTML report Playwright yang berisi:

- `test.step()` yang manusiawi
- screenshot per step
- video per journey
- trace per journey
- raw manifest dan screenshot stabil di `artifacts/journeys/latest`

Pipeline resmi:

1. `npm run dev:setup`
2. `npm run dev:smoke`
3. `npm run e2e:smoke`
4. `npm run e2e:journey`
5. `npm run journey:open`

## Output utama

- Latest Playwright report: [`artifacts/playwright-report/latest/index.html`](/Users/adi/Code/startup/bidanapp/artifacts/playwright-report/latest/index.html)
- Latest raw artifacts: [`artifacts/journeys/latest`](/Users/adi/Code/startup/bidanapp/artifacts/journeys/latest)
- Golden references: [`docs/journeys/golden`](/Users/adi/Code/startup/bidanapp/docs/journeys/golden)

## Handbook

- [Pipeline](./pipeline.md)
- [Coverage Matrix](./coverage-matrix.md)
- [Review Guide](./review-guide.md)

## Use Cases

- [Customer login and native account security](./use-cases/customer-auth-sso.md)
- [Customer password recovery request](./use-cases/customer-password-recovery.md)
- [Customer native register flow](./use-cases/customer-register-success.md)
- [Customer invalid login guard](./use-cases/customer-invalid-login.md)
- [Visitor public browsing flow](./use-cases/public-visitor-browse.md)
- [Localhost redirect guard](./use-cases/localhost-lvh-redirect.md)
- [Customer home, profile, and notifications](./use-cases/customer-home-profile-notifications.md)
- [Customer order and payment](./use-cases/customer-order-payment.md)
- [Customer support ticket flow](./use-cases/customer-support-ticket.md)
- [Draft professional apply state](./use-cases/professional-draft-apply-state.md)
- [Submitted professional review state](./use-cases/professional-apply-review-state.md)
- [Submitted professional publish gate](./use-cases/professional-submitted-offerings-gated.md)
- [Approved professional workspace](./use-cases/professional-workspace-approved.md)
- [Admin login overview](./use-cases/admin-login-overview.md)
- [Admin professional review queue](./use-cases/admin-review-queue.md)
- [Admin console route coverage](./use-cases/admin-console-route-map.md)
- [Admin support triage](./use-cases/admin-support-triage.md)
- [Admin refund and payout](./use-cases/admin-refund-payout.md)

## Rule of truth

Flow dianggap siap review bila empat artefak ini ada bersama:

1. smoke atau readiness relevan tetap hijau
2. journey E2E berhasil
3. Playwright report latest memuat screenshot, video, dan trace
4. handbook use case menjelaskan aktor, precondition, dan expected state
