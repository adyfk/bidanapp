import { ProfessionalDetailScreen } from '@/components/screens/ProfessionalDetailScreen';
import { MOCK_PROFESSIONALS, MOCK_CATEGORIES } from '@/lib/constants';
import { APP_CONFIG } from '@/lib/config';
import { Metadata } from 'next';

const profCategory = MOCK_CATEGORIES.find(c => c.id === MOCK_PROFESSIONALS[0].categoryId)?.name || 'Professional';

export const metadata: Metadata = {
  title: `${MOCK_PROFESSIONALS[0].name} - ${profCategory} | ${APP_CONFIG.appName}`,
  description: MOCK_PROFESSIONALS[0].about,
};

export default function ProfessionalDetailRoute() {
  return <ProfessionalDetailScreen />;
}
