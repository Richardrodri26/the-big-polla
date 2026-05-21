"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

// ─── Context ─────────────────────────────────────────────────────────────────

interface ResponsiveDialogContextValue {
  isDesktop: boolean
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isDesktop: false,
})

function useResponsiveDialog() {
  return React.useContext(ResponsiveDialogContext)
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <ResponsiveDialogContext.Provider value={{ isDesktop: true }}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      </ResponsiveDialogContext.Provider>
    )
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isDesktop: false }}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    </ResponsiveDialogContext.Provider>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

function ResponsiveDialogContent({
  children,
  className,
  showCloseButton = true,
}: ResponsiveDialogContentProps) {
  const { isDesktop } = useResponsiveDialog()

  if (isDesktop) {
    return (
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "bg-[var(--bg-2)] border border-[var(--line)] rounded-2xl p-0 sm:max-w-[480px] gap-0 shadow-xl",
          className
        )}
      >
        {children}
      </DialogContent>
    )
  }

  return (
    <DrawerContent
      className={cn(
        // Hide vaul's default grab handle — we render our own
        "bg-[var(--bg-2)] border-t border-[var(--line)] rounded-t-3xl [&>div:first-child]:hidden",
        className
      )}
    >
      {/* Stadium Concrete grab handle: 36px wide, fg-faint color */}
      <div className="mx-auto mt-3 mb-0 h-1 w-9 shrink-0 rounded-full bg-[var(--fg-faint)]" />
      {children}
    </DrawerContent>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isDesktop } = useResponsiveDialog()

  if (isDesktop) {
    return (
      <DialogHeader
        className={cn("px-6 pt-5 pb-2", className)}
        {...props}
      />
    )
  }

  return (
    <DrawerHeader
      className={cn("px-[var(--gutter)] pt-3 pb-2 text-left", className)}
      {...props}
    />
  )
}

// ─── Title ────────────────────────────────────────────────────────────────────

function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  const { isDesktop } = useResponsiveDialog()

  if (isDesktop) {
    return (
      <DialogTitle
        className={cn("text-base font-bold text-[var(--fg)]", className)}
        {...props}
      />
    )
  }

  return (
    <DrawerTitle
      className={cn("text-base font-bold text-[var(--fg)]", className)}
      {...props}
    />
  )
}

// ─── Close ────────────────────────────────────────────────────────────────────

function ResponsiveDialogClose({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { isDesktop } = useResponsiveDialog()

  if (isDesktop) {
    return <DialogClose className={className} {...props} />
  }

  return <DrawerClose className={className} {...props} />
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogClose,
}
