import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-28 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        This page never shipped
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Or it failed its smoke test. Either way, it&apos;s not here.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
