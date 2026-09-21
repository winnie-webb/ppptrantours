import AdminClient from "./AdminClient";

/* Title and robots are set by app/admin/layout.js, which owns this document. */

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
      <header className="mb-8">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-crimson-700">
          PPP Tran Tours
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Bookings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          Everything submitted through the booking and contact forms, newest
          first.
        </p>
      </header>

      <AdminClient />
    </main>
  );
}
