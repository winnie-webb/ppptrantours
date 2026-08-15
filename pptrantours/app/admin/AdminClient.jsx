"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FaGoogle,
  FaSignOutAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaInbox,
  FaSyncAlt,
} from "react-icons/fa";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Bookings console.
 *
 * Sign-in happens in the browser, but it grants nothing on its own: the ID
 * token is sent to /api/admin/bookings, which verifies it server-side and
 * checks the email against ADMIN_EMAILS before reading anything. Firestore
 * itself still denies every client request.
 */
export default function AdminClient() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;

    setStatus("loading");
    setError("");

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error ?? "Could not load bookings.");

      setBookings(data.bookings ?? []);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  /*
   * One effect, and every state change happens inside the auth callback rather
   * than in the effect body — the fetch is triggered by Firebase telling us who
   * is signed in, not by a render observing that `user` changed.
   *
   * When Firebase is unconfigured `getFirebaseAuth()` is null and there is
   * nothing to subscribe to; the render path returns the notice before it ever
   * consults `authReady`.
   */
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return undefined;

    let unsub = () => {};
    let cancelled = false;

    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      if (cancelled) return;

      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
        if (u) load();
      });
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [load]);

  const signIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setError("");
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(
        err?.code === "auth/operation-not-allowed"
          ? "Google sign-in is not enabled for this Firebase project yet."
          : (err?.message ?? "Sign-in failed.")
      );
    }
  };

  const signOutNow = async () => {
    const auth = getFirebaseAuth();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    setBookings(null);
  };

  if (!isFirebaseConfigured) {
    return (
      <Notice>
        Firebase isn&apos;t configured for this build, so there&apos;s nothing to
        sign in to. Add the <code>NEXT_PUBLIC_FIREBASE_*</code> keys and redeploy.
      </Notice>
    );
  }

  if (!authReady) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink/50">
        <FaSpinner className="animate-spin" /> Checking sign-in…
      </p>
    );
  }

  if (!user) {
    return (
      <div className="card max-w-md p-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          This page is limited to the accounts listed in{" "}
          <code className="text-ink/70">ADMIN_EMAILS</code>.
        </p>
        <button type="button" onClick={signIn} className="btn-primary mt-6 w-full">
          <FaGoogle /> Continue with Google
        </button>
        {error && <ErrorLine>{error}</ErrorLine>}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink/60">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={status === "loading"}
            className="btn-ghost disabled:opacity-60"
          >
            {status === "loading" ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaSyncAlt className="text-xs" />
            )}
            Refresh
          </button>
          <button type="button" onClick={signOutNow} className="btn-ghost">
            <FaSignOutAlt className="text-xs" /> Sign out
          </button>
        </div>
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      {bookings?.length === 0 && (
        <Notice>
          <FaInbox className="mb-2 text-2xl text-ink/30" />
          <br />
          No bookings yet. They appear here the moment someone submits the form.
        </Notice>
      )}

      {bookings?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-ink/[0.07] shadow-card">
          <table className="w-full min-w-[52rem] border-collapse bg-white text-sm">
            <thead>
              <tr className="border-b border-ink/[0.07] bg-sand text-left">
                {["Reference", "Received", "Guest", "Tour", "When", "Party", "Total"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/50"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {bookings.map((b) => (
                <tr key={b.id} className="align-top hover:bg-sand/60">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-crimson-700">
                    {b.reference}
                    {b.type === "enquiry" && (
                      <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink/50">
                        Enquiry
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/50">
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleString("en-JM", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">{b.name}</span>
                    <a
                      href={`mailto:${b.email}`}
                      className="block text-xs text-ink/50 hover:text-crimson-700"
                    >
                      {b.email}
                    </a>
                    {b.phone && (
                      <span className="block text-xs text-ink/50">{b.phone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-ink">{b.tourTitle || "—"}</span>
                    {b.pickupLabel && (
                      <span className="block text-xs text-ink/50">
                        {b.pickupLabel}
                      </span>
                    )}
                    {b.flightNumber && (
                      <span className="block text-xs text-ink/50">
                        Flight {b.flightNumber}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {b.date || "—"}
                    {b.time && (
                      <span className="block text-xs text-ink/50">{b.time}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/70">
                    {b.adults}
                    {b.children > 0 && ` + ${b.children}c`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                    {b.total ? `$${Number(b.total).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookings?.length > 0 && (
        <p className="mt-4 text-xs text-ink/40">
          Showing the {bookings.length} most recent. Notes are stored but not
          listed here — open the record in the Firebase console for the full text.
        </p>
      )}
    </>
  );
}

function Notice({ children }) {
  return (
    <div className="card max-w-xl p-8 text-center text-sm leading-relaxed text-ink/60">
      {children}
    </div>
  );
}

function ErrorLine({ children }) {
  return (
    <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <FaExclamationTriangle className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
