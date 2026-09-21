"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaGoogle,
  FaSignOutAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaInbox,
  FaSyncAlt,
  FaChevronDown,
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMoneyBillWave,
  FaTimes,
} from "react-icons/fa";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Bookings console.
 *
 * Sign-in happens in the browser, but it grants nothing on its own: the ID
 * token is sent to /api/admin/bookings, which verifies it server-side and
 * checks the email against ADMIN_EMAILS before reading anything. Firestore
 * itself still denies every client request.
 *
 * ── What changed, and why ───────────────────────────────────────────────────
 *
 * This was a read-only table against an API that already had a whole back
 * office behind it. `PATCH` moved a booking's status, `POST` recorded a cash
 * payment, `GET /[id]` returned the notes and the payment history, and the list
 * route computed an `attention` band — and none of it was ever called. So the
 * owner could not confirm a booking, could not record the cash he takes in the
 * vehicle, could not tell from the list who had paid, and was told in the
 * footnote to open the Firebase console to read a guest's notes.
 *
 * It is all wired up here. Nothing new was needed on the server.
 *
 * ── Mobile ─────────────────────────────────────────────────────────────────
 *
 * He runs this from a phone. The table was `min-w-[52rem]` inside an
 * `overflow-x-auto`, so every column past "Guest" was off-screen. Below `lg`
 * this is a card list; the table survives above it, where there is room.
 */

/** Server-side truth is app/api/admin/bookings/[id]/route.js. Mirrored for labels. */
const TRANSITIONS = {
  new: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const STATUS_LABEL = {
  new: "Needs a decision",
  confirmed: "Confirmed",
  assigned: "Driver assigned",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ACTION_LABEL = {
  confirmed: "Confirm",
  assigned: "Driver assigned",
  completed: "Mark done",
  cancelled: "Cancel",
};

const STATUS_TONE = {
  new: "bg-gold-200/60 text-ink/70",
  confirmed: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  completed: "bg-ink/5 text-ink/50",
  cancelled: "bg-red-50 text-red-700",
};

const PAY_LABEL = {
  unpaid: "Unpaid",
  "part-paid": "Part paid",
  paid: "Paid",
  pending: "Clearing",
  failed: "Card failed",
};

const PAY_TONE = {
  unpaid: "bg-ink/5 text-ink/50",
  "part-paid": "bg-gold-200/60 text-ink/70",
  paid: "bg-green-100 text-green-800",
  pending: "bg-gold-200/60 text-ink/70",
  failed: "bg-red-50 text-red-700",
};

const METHODS = [
  { key: "cash", label: "Cash on the day" },
  { key: "paypal-manual", label: "PayPal, by hand" },
  { key: "bank", label: "Bank transfer" },
];

const money = (cents) => `$${(Number(cents ?? 0) / 100).toFixed(2)}`;

function when(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminClient() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [attention, setAttention] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [term, setTerm] = useState("");
  const [openRef, setOpenRef] = useState(null);

  /*
   * Every call needs a fresh ID token, and every call needs the same error
   * handling. One helper, so a route added later cannot forget the header.
   */
  const call = useCallback(async (path, init) => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) throw new Error("Not signed in.");
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "That didn't work.");
    return data;
  }, []);

  const load = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;

    setStatus("loading");
    setError("");

    try {
      const data = await call("/api/admin/bookings");
      setBookings(data.bookings ?? []);
      setAttention(data.attention ?? null);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [call]);

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
    setAttention(null);
  };

  /*
   * Filtering client-side over the 200 the route already sent.
   *
   * Two hundred bookings is a year of trading for a one-vehicle operator, and
   * they are in memory the moment the page loads. A server round trip per
   * keystroke would be slower and would cost a Firestore read each time.
   */
  const shown = useMemo(() => {
    if (!bookings) return [];
    const q = term.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter === "attention") {
        // The same two rules the list route uses to build `attention`: money
        // taken against a booking nobody has confirmed, and money in limbo.
        const state = b.payment?.state;
        const paidUnconfirmed =
          (state === "paid" || state === "part-paid") &&
          (b.status ?? "new") === "new";
        return paidUnconfirmed || state === "pending";
      }
      if (filter !== "all" && (b.status ?? "new") !== filter) return false;
      if (!q) return true;
      return [b.reference, b.name, b.email, b.phone, b.placeLabel, b.tourTitle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [bookings, filter, term]);

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

  const urgent =
    (attention?.paidUnconfirmed?.length ?? 0) +
    (attention?.paymentPending?.length ?? 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

      {/*
        The two states that cost real money if they sit unread, computed by the
        list route and previously thrown away. Paid-but-unconfirmed is the
        expensive one: the guest has been charged and nobody has agreed the date.
      */}
      {urgent > 0 && (
        <div className="mb-6 rounded-2xl border border-gold-400/40 bg-gold-200/30 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FaExclamationTriangle className="text-gold-600" />
            {urgent} {urgent === 1 ? "booking needs" : "bookings need"} your
            attention
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            {attention.paidUnconfirmed?.length > 0 && (
              <li>
                <span className="font-semibold">Paid, not confirmed:</span>{" "}
                {attention.paidUnconfirmed.join(", ")}
              </li>
            )}
            {attention.paymentPending?.length > 0 && (
              <li>
                <span className="font-semibold">Payment still clearing:</span>{" "}
                {attention.paymentPending.join(", ")}
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => setFilter("attention")}
            className="mt-3 text-xs font-semibold text-crimson-700 underline"
          >
            Show only these
          </button>
        </div>
      )}

      {bookings?.length > 0 && (
        <div className="mb-5 space-y-3">
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Reference, name, phone, hotel…"
            className="field"
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              ["all", "All"],
              ["attention", "Needs attention"],
              ["new", "Needs a decision"],
              ["confirmed", "Confirmed"],
              ["assigned", "Assigned"],
              ["completed", "Completed"],
              ["cancelled", "Cancelled"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === key
                    ? "bg-crimson-600 text-white"
                    : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {bookings?.length === 0 && (
        <Notice>
          <FaInbox className="mb-2 text-2xl text-ink/30" />
          <br />
          No bookings yet. They appear here the moment someone submits the form.
        </Notice>
      )}

      {bookings?.length > 0 && shown.length === 0 && (
        <Notice>Nothing matches that.</Notice>
      )}

      {shown.length > 0 && (
        <ul className="space-y-3">
          {shown.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              open={openRef === b.reference}
              onToggle={() =>
                setOpenRef(openRef === b.reference ? null : b.reference)
              }
              call={call}
              onChanged={load}
            />
          ))}
        </ul>
      )}

      {shown.length > 0 && (
        <p className="mt-4 text-xs text-ink/40">
          Showing {shown.length} of the {bookings.length} most recent. Tap a
          booking to see the guest&apos;s notes, move it on, or record a payment.
        </p>
      )}
    </>
  );
}

/**
 * One booking, collapsed to what matters at a glance and expandable to
 * everything else.
 *
 * A card rather than a table row, at every width. The table it replaced needed
 * `min-w-[52rem]`, and the owner reads this on a phone — so the columns that
 * mattered most (is it paid? has it been confirmed?) were the ones off the
 * right-hand edge. They are the two badges at the top now.
 */
function BookingRow({ booking: b, open, onToggle, call, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState("");
  const [rowError, setRowError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const fetched = useRef(false);

  const st = b.status ?? "new";
  const pay = b.payment?.state ?? "unpaid";
  const moves = TRANSITIONS[st] ?? [];

  // Detail is fetched on expand, not on mount: 200 rows would be 200 reads of
  // data nobody has asked to see. `fetched` stops a re-render refetching it,
  // and anything that changes the booking clears it — see `invalidate`.
  useEffect(() => {
    if (!open || fetched.current) return;
    fetched.current = true;
    call(`/api/admin/bookings/${b.reference}`)
      .then(setDetail)
      .catch((err) => setRowError(err.message));
  }, [open, b.reference, call, detail]);

  /*
   * The row survives a reload — its key is the booking id — so `fetched` would
   * otherwise stay true and the expanded panel would go on showing the payment
   * history and audit trail from before the change that was just made.
   */
  const invalidate = () => {
    fetched.current = false;
    setDetail(null);
  };

  const move = async (next) => {
    setBusy(next);
    setRowError("");
    try {
      await call(`/api/admin/bookings/${b.reference}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      invalidate();
      await onChanged();
    } catch (err) {
      setRowError(err.message);
    } finally {
      setBusy("");
    }
  };

  const owed = (b.payment?.payableCents ?? 0) - (b.payment?.paidCents ?? 0);

  return (
    <li className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-card">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-crimson-700">{b.reference}</span>
          <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st] ?? st}</Badge>
          <Badge tone={PAY_TONE[pay]}>{PAY_LABEL[pay] ?? pay}</Badge>
          {b.type !== "booking" && (
            <Badge tone="bg-ink/5 text-ink/50">
              {b.type === "enquiry" ? "Enquiry" : "Quote request"}
            </Badge>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-ink/50 transition hover:text-crimson-700"
          >
            {open ? "Less" : "More"}
            <FaChevronDown
              className={`text-[0.6rem] transition ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Guest">
            <span className="font-medium text-ink">{b.name}</span>
            {b.phone && (
              <span className="block text-xs text-ink/50">{b.phone}</span>
            )}
          </Field>
          <Field label={b.kind === "transfer" ? "Transfer" : "Tour"}>
            <span className="text-ink/80">{b.tourTitle || "—"}</span>
            {b.placeLabel && (
              <span className="block text-xs text-ink/50">{b.placeLabel}</span>
            )}
          </Field>
          <Field label="When">
            <span className="text-ink/80">{b.date || "—"}</span>
            {b.time && <span className="block text-xs text-ink/50">{b.time}</span>}
            {b.flightNumber && (
              <span className="block text-xs text-ink/50">
                Flight {b.flightNumber}
              </span>
            )}
          </Field>
          <Field label="Transport">
            <span className="font-semibold text-ink">
              {b.transportTotal != null
                ? `$${Number(b.transportTotal).toFixed(2)}`
                : "quote"}
            </span>
            <span className="block text-xs text-ink/50">
              {b.adults}
              {b.children > 0 && ` + ${b.children}c`}
              {owed > 0 && b.payment?.payableCents > 0 && (
                <span className="text-crimson-700"> · {money(owed)} owing</span>
              )}
            </span>
          </Field>
        </div>

        {moves.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {moves.map((next) => (
              <button
                key={next}
                type="button"
                onClick={() => move(next)}
                disabled={Boolean(busy)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                  next === "cancelled"
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-crimson-600 text-white hover:bg-crimson-700"
                }`}
              >
                {busy === next ? "…" : ACTION_LABEL[next] ?? next}
              </button>
            ))}
            {pay !== "paid" && (
              <button
                type="button"
                onClick={() => setPayOpen(!payOpen)}
                className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-ink/10"
              >
                <FaMoneyBillWave className="text-[0.65rem]" />
                Record a payment
              </button>
            )}
          </div>
        )}

        {rowError && <ErrorLine>{rowError}</ErrorLine>}

        {payOpen && (
          <RecordPayment
            reference={b.reference}
            defaultCents={owed > 0 ? owed : b.payment?.payableCents ?? 0}
            call={call}
            onDone={async () => {
              setPayOpen(false);
              invalidate();
              await onChanged();
            }}
            onCancel={() => setPayOpen(false)}
          />
        )}
      </div>

      {open && (
        <div className="border-t border-ink/[0.07] bg-sand/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
                Contact
              </p>
              <a
                href={`mailto:${b.email}`}
                className="flex items-center gap-2 text-ink/70 hover:text-crimson-700"
              >
                <FaEnvelope className="text-xs text-ink/40" />
                {b.email}
              </a>
              {b.phone && (
                <>
                  <a
                    href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center gap-2 text-ink/70 hover:text-crimson-700"
                  >
                    <FaPhone className="text-xs text-ink/40" />
                    {b.phone}
                  </a>
                  <a
                    href={`https://wa.me/${b.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-ink/70 hover:text-crimson-700"
                  >
                    <FaWhatsapp className="text-xs text-[#25D366]" />
                    WhatsApp
                  </a>
                </>
              )}
              <p className="pt-1 text-xs text-ink/45">
                Received {when(b.createdAt)}
              </p>
              {b.tripType && (
                <p className="text-xs text-ink/45">
                  {b.tripType === "one-way" ? "One way" : "Round trip"}
                  {b.returnDate && ` · back ${b.returnDate}`}
                  {b.returnFlight && ` · ${b.returnFlight}`}
                </p>
              )}
              {b.settlement && (
                <p className="text-xs text-ink/45">
                  Settling: {b.settlement}
                  {b.payment?.intent && ` · chose ${b.payment.intent}`}
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
                Notes from the guest
              </p>
              <p className="whitespace-pre-wrap leading-relaxed text-ink/70">
                {b.notes?.trim() || <span className="text-ink/35">None.</span>}
              </p>
              {b.entryLines?.length > 0 && (
                <>
                  <p className="pt-2 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
                    Gate fees (guest pays at the gate)
                  </p>
                  <ul className="text-xs text-ink/60">
                    {b.entryLines.map((l) => (
                      <li key={l}>· {l}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-ink/[0.07] pt-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
              Payment history
            </p>
            {!detail ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-ink/45">
                <FaSpinner className="animate-spin" /> Loading…
              </p>
            ) : detail.payments?.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-xs">
                {detail.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap gap-x-3 text-ink/60">
                    <span className="font-semibold text-ink/80">
                      {money(p.amountCents)}
                    </span>
                    <span>{p.state}</span>
                    <span>{p.provider}</span>
                    {p.providerStatus && <span>{p.providerStatus}</span>}
                    {p.providerTxnId && (
                      <span className="text-ink/40">{p.providerTxnId}</span>
                    )}
                    {p.verifiedBy && (
                      <span className="text-ink/40">by {p.verifiedBy}</span>
                    )}
                    <span className="text-ink/40">{when(p.settledAt ?? p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ink/35">
                No payment attempts against this booking.
              </p>
            )}

            {detail?.booking?.history?.length > 0 && (
              <>
                <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
                  Who changed what
                </p>
                <ul className="mt-2 space-y-1 text-xs text-ink/50">
                  {detail.booking.history.map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      {STATUS_LABEL[h.status] ?? h.status} · {h.by} ·{" "}
                      {when(h.at)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Money taken outside the website.
 *
 * Most of PPP's income still arrives as cash in the vehicle, and until now
 * there was no way for it to reach the books — the route has accepted this
 * since it was written and nothing ever called it.
 */
function RecordPayment({ reference, defaultCents, call, onDone, onCancel }) {
  const [amount, setAmount] = useState(
    defaultCents > 0 ? (defaultCents / 100).toFixed(2) : ""
  );
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setErr("Enter an amount.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await call(`/api/admin/bookings/${reference}`, {
        method: "POST",
        body: JSON.stringify({ amountCents: cents, method, note }),
      });
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-ink/[0.09] bg-sand/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink/70">Record a payment</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="text-ink/40 hover:text-ink/70"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
        <label className="block">
          <span className="block text-[0.68rem] font-medium text-ink/50">
            Amount (USD)
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field"
          />
        </label>
        <label className="block">
          <span className="block text-[0.68rem] font-medium text-ink/50">
            How
          </span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="field"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[0.68rem] font-medium text-ink/50">
            Note (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
          />
        </label>
      </div>

      {err && <ErrorLine>{err}</ErrorLine>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="btn-primary mt-3 w-full disabled:opacity-60"
      >
        {busy ? <FaSpinner className="animate-spin" /> : <FaMoneyBillWave />}
        Save this payment
      </button>
      <p className="mt-2 text-[0.68rem] leading-relaxed text-ink/45">
        Recorded against your account, so it is clear later who vouched for it.
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink/40">
        {label}
      </span>
      {children}
    </div>
  );
}

function Badge({ tone, children }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${tone}`}
    >
      {children}
    </span>
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
    <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <FaExclamationTriangle className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
