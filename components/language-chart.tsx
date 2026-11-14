/** Horizontal stacked language chart + legend, rendered server-side.
 *  Data is the real bytes-per-language breakdown from the GitHub API. */

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  Shell: "#89e051",
  RobotFramework: "#8c3fdf",
  Ruby: "#701516",
  Go: "#00add8",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  PHP: "#4f5d95",
  Swift: "#f05138",
  PowerShell: "#012456",
};

const FALLBACK = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899"];

function colorFor(lang: string, idx: number): string {
  return LANG_COLORS[lang] ?? FALLBACK[idx % FALLBACK.length];
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

export function LanguageChart({ languages }: { languages: Record<string, number> }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  return (
    <div>
      {/* stacked bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label="Language distribution"
      >
        {entries.map(([lang, bytes], i) => (
          <div
            key={lang}
            style={{ width: `${(bytes / total) * 100}%`, backgroundColor: colorFor(lang, i) }}
            title={`${lang} — ${((bytes / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {/* legend */}
      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {entries.map(([lang, bytes], i) => (
          <li key={lang} className="flex items-center gap-2.5 text-[13px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(lang, i) }}
              aria-hidden
            />
            <span className="font-medium text-ink">{lang}</span>
            <span className="text-muted">
              {((bytes / total) * 100).toFixed(1)}% · {formatBytes(bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
