import { SectionHeading } from "@/components/ui/section-heading";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Profile, security, and preferences"
        description="Settings pages can be wired to account preferences, security, and notification controls."
      />
      <div className="rounded-[2rem] border border-border bg-card/90 p-6 text-sm text-muted shadow-[var(--shadow-soft)]">
        Settings are coming soon.
      </div>
    </div>
  );
}
