import { Bell, Calendar, ChevronLeft, Home, Trophy, User } from "lucide-react";
import { BottomNavDemo } from "@/app/dev/_components/bottom-nav-demo";
import { DomainDemo } from "@/app/dev/_components/domain-demo";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";

export default function DevPage() {
  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] p-8 pb-24 space-y-12">
        <h1 className="text-2xl font-bold text-[var(--fg)]">
          Component Sandbox
        </h1>

        {/* Topbar */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Topbar
          </h2>
          <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--line)] space-y-0.5">
            <Topbar title="The Big Polla" />
            <Topbar
              title="Fase de Grupos"
              leading={
                <button type="button" className="text-[var(--fg-mute)]">
                  <ChevronLeft size={20} />
                </button>
              }
            />
            <Topbar
              title="Mi Liga"
              leading={
                <button type="button" className="text-[var(--fg-mute)]">
                  <ChevronLeft size={20} />
                </button>
              }
              trailing={
                <button type="button" className="text-[var(--fg-mute)]">
                  <Bell size={18} />
                </button>
              }
            />
          </div>
        </section>

        {/* Button */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Button
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" size="sm">
              Small
            </Button>
            <Button variant="default" size="default">
              Default
            </Button>
            <Button variant="default" size="lg">
              Large
            </Button>
            <Button variant="default" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* Icon */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Icon
          </h2>
          <div className="flex items-end gap-6 text-[var(--fg)]">
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="sm" />
              <span className="text-xs text-[var(--fg-faint)]">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="md" />
              <span className="text-xs text-[var(--fg-faint)]">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="lg" />
              <span className="text-xs text-[var(--fg-faint)]">lg</span>
            </div>
            <Icon icon={Trophy} size="lg" className="text-[var(--signal)]" />
            <Icon icon={User} size="lg" className="text-[var(--fg-mute)]" />
            <Icon icon={Calendar} size="lg" className="text-[var(--warn)]" />
          </div>
        </section>

        {/* Flag */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Flag
          </h2>
          <div className="flex items-end gap-6">
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="sm" />
              <span className="text-xs text-[var(--fg-faint)]">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="md" />
              <span className="text-xs text-[var(--fg-faint)]">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="lg" />
              <span className="text-xs text-[var(--fg-faint)]">lg</span>
            </div>
            <Flag code="BR" size="lg" />
            <Flag code="FR" size="lg" />
            <Flag code="DE" size="lg" />
            <Flag code="ES" size="lg" />
            <Flag code="US" size="lg" />
          </div>
        </section>

        {/* Pill */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Pill
          </h2>
          <div className="flex flex-wrap gap-3">
            <Pill status="live" />
            <Pill status="upcoming" />
            <Pill status="finished" />
          </div>
        </section>

        {/* BottomNav */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            BottomNav
          </h2>
          <p className="text-xs text-[var(--fg-faint)]">
            Fixed en el bottom real — verificar scrolleando la página.
          </p>
        </section>

        {/* Domain Components */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Domain Components
          </h2>
          <DomainDemo />
        </section>
      </div>

      <BottomNavDemo />
    </>
  );
}
