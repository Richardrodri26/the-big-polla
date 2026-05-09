import { Home, Trophy, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-8 space-y-12">
      <h1 className="text-2xl font-bold text-[var(--fg)]">
        Component Sandbox
      </h1>

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
          <Button variant="default" size="sm">Small</Button>
          <Button variant="default" size="default">Default</Button>
          <Button variant="default" size="lg">Large</Button>
          <Button variant="default" disabled>Disabled</Button>
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
    </div>
  );
}
