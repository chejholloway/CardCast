export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="max-w-xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold">
          Bluesky Link Card Extension Backend
        </h1>
        <p className="text-sm text-slate-300">
          This Next.js app exposes a tRPC API consumed by the Chrome/Edge
          extension. There is no public UI here.
        </p>
      </div>
    </main>
  );
}

