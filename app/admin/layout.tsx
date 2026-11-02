import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { section: "Content", items: [
    { href: "/admin", label: "Overview", active: true, soon: false },
    { href: "/admin/articles", label: "Articles & Workflow", soon: false },
    { href: "#", label: "Content Ideas", soon: true },
    { href: "#", label: "Research Queue", soon: true },
    { href: "#", label: "Media Library", soon: true },
    { href: "#", label: "Content Calendar", soon: true },
  ]},
  { section: "Publishing", items: [
    { href: "#", label: "X Publishing", soon: true },
    { href: "#", label: "LinkedIn Publishing", soon: true },
    { href: "#", label: "Publishing History", soon: true },
    { href: "#", label: "Connected Accounts", soon: true },
  ]},
  { section: "System", items: [
    { href: "#", label: "AI Agents", soon: true },
    { href: "#", label: "Analytics", soon: true },
    { href: "#", label: "Website Settings", soon: true },
    { href: "#", label: "Audit Logs", soon: true },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-6 flex items-baseline justify-between lg:block">
          <p className="font-display text-lg font-semibold text-ink">Dashboard</p>
          <form action={logoutAction} className="lg:mt-2">
            <button
              type="submit"
              className="text-[12px] text-muted transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>

        <nav aria-label="Admin" className="space-y-5">
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                {group.section}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                        item.active
                          ? "bg-accent-soft text-accent-ink"
                          : "text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {item.label}
                      {item.soon && (
                        <span className="text-[10px] uppercase tracking-wide text-faint">soon</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
