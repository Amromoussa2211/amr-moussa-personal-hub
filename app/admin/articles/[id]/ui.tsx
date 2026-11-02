"use client";

import { useState } from "react";

export function ConfirmSubmit({
  children,
  message,
  disabled,
  title,
}: {
  children: React.ReactNode;
  message: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      className="rounded-lg border border-hairline px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function VersionTabs({
  versions,
  currentId,
  slug,
}: {
  versions: { id: string; version_no: number; created_at: string; note: string | null; created_by: string }[];
  currentId: string | null;
  slug: string;
}) {
  const [open, setOpen] = useState(false);

  if (versions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink">
          Version history ({versions.length})
        </span>
        <span className="text-[12px] text-faint">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-4 px-5 py-3 text-[13px]">
              <div className="min-w-0">
                <span className="font-mono text-[12px] text-ink">v{v.version_no}</span>
                {v.id === currentId && (
                  <span className="ms-2 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-ink">
                    current
                  </span>
                )}
                {v.note && <p className="mt-0.5 truncate text-faint">{v.note}</p>}
              </div>
              <span className="shrink-0 text-[12px] text-faint">
                {v.created_by === "amr" ? "you" : v.created_by}
                {" · "}
                {new Date(v.created_at).toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
