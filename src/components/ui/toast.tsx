"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function Toast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="toast" style={{ opacity: 1 }}>
      {toast.message}
    </div>
  );
}
