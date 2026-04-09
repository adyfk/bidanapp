import type { ServicePlatformId } from '@marketplace/platform-config';
import { ProfessionalWorkspacePage } from '../workspace/view';

export function ProfessionalOfferingsPage({
  authHref,
  locale,
  platformId,
}: {
  authHref: string;
  locale: string;
  platformId: ServicePlatformId;
}) {
  return <ProfessionalWorkspacePage authHref={authHref} locale={locale} platformId={platformId} section="offerings" />;
}
