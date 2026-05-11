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
      <SidebarInset className="min-h-dvh flex flex-col overflow-hidden">
        {children}
        <MobileBottomNav />
        <PredictorOverlay />
        <Toast />
      </SidebarInset>
    </SidebarProvider>
  );
}
