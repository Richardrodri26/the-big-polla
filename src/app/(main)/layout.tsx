import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PredictorOverlay } from "@/components/domain/predictor-overlay";
import { Toast } from "@/components/ui/toast";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-dvh flex-col">
        {children}
        <MobileBottomNav />
        <PredictorOverlay />
        <Toast />
      </SidebarInset>
    </SidebarProvider>
  );
}
