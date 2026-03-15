import { HomeScreen } from '@/components/screens/HomeScreen';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home - BidanApp',
  description: 'Find your doctor and make an appointment.',
};

export default function HomeRoute() {
  return <HomeScreen />;
}
