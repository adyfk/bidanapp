import { ChatScreen } from '@/components/screens/ChatScreen';

export default async function Chat(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ChatScreen professionalId={params.id} />;
}
