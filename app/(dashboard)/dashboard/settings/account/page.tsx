import { SectionHeading } from "@/components/ui/section-heading";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Account"
        title="Profile and account details"
        description="Update profile information and account preferences from this screen."
      />
      <div className="rounded-[2rem] border border-border bg-card/90 p-6 text-sm text-muted shadow-[var(--shadow-soft)]">
        Account settings are coming soon.
      </div>
    </div>
  );
}
