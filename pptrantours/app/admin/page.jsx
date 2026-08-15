import AdminClient from "./AdminClient";

/** Keep this page out of search results and out of the sitemap. */
export const metadata = {
  title: "Bookings",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return (
    <section className="shell py-16 lg:py-24">
      <p className="eyebrow">Internal</p>
      <h1 className="mt-2.5 font-display text-3xl font-semibold text-ink sm:text-[2.5rem]">
        Bookings
      </h1>
      <p className="mt-3.5 max-w-2xl text-[1.05rem] leading-relaxed text-ink/60">
        Everything submitted through the booking and contact forms, newest first.
      </p>

      <div className="mt-10">
        <AdminClient />
      </div>
    </section>
  );
}
