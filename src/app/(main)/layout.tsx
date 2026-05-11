import { PredictorOverlay } from "@/components/domain/predictor-overlay";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Toast } from "@/components/ui/toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
      <PredictorOverlay />
      <Toast />
    </>
  );
}
