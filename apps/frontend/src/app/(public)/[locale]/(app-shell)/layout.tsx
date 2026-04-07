import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { CustomerPushBootstrap } from '@/components/runtime/CustomerPushBootstrap';

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CustomerPushBootstrap />
      <div className="flex min-h-screen justify-center bg-gray-100 font-sans">
        <div className="relative flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white shadow-xl">
          <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
          <BottomNavBar />
        </div>
      </div>
    </>
  );
}
