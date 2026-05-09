import { Button } from "@/components/ui/button";

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
    </div>
  );
}
