"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaLock,
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
  FaStar,
  FaCarSide,
  FaPlus,
} from "react-icons/fa";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { describeDirection } from "@/app/products/pricing";
import {
  buildReviewRequestWhatsApp,
  buildDriverJobWhatsApp,
  buildDriverIntroWhatsApp,
} from "@/lib/booking-shared";
import { canAssign, documentStatus, DRIVER_DOCUMENTS } from "@/lib/drivers";
import { formatDateTime, formatTime12, transferLegs } from "@/lib/booking-times";

/**
 * `direction` is the current three-way field; older bookings only carry the
 * two-way `tripType`. Reading it in one place means every future field on a
 * booking gets the same treatment, rather than each display site guessing.
 */
function directionOf(b) {
  if (b.direction) return b.direction;
  if (!b.tripType) return null;
  return b.tripType === "one-way" ? "to-hotel" : "both";
}

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

/*
 * Imperatives. These are buttons, so they have to say what pressing them does,
 * not name the state they lead to — "Driver assigned" on a confirmed booking
 * read as a statement that one already had been.
 */
const ACTION_LABEL = {
  confirmed: "Confirm",
  assigned: "Assign a driver",
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
  const [view, setView] = useState("bookings"); // bookings | drivers
  const [drivers, setDrivers] = useState(null);
  const [driversError, setDriversError] = useState("");

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
    /*
     * A non-JSON body is the interesting case, not an edge case.
     *
     * When a route throws before its own try block, Next answers with an HTML
     * error page — no `error` field, nothing to read. This used to collapse to
     * "That didn't work.", which is what the console showed for the whole time
     * `firebase-admin/auth` was failing to load: the one message that cannot be
     * acted on. The status code at least says where to look.
     */
    const body = await res.text();
    let data = {};
    try {
      data = body ? JSON.parse(body) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(
        data.error ??
          `The server returned ${res.status}${
            res.statusText ? ` ${res.statusText}` : ""
          } with no explanation. Check the Vercel runtime logs for this request.`
      );
    }
    return data;
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const data = await call("/api/admin/drivers");
      setDrivers(data.drivers ?? []);
      setDriversError("");
    } catch (err) {
      setDriversError(err.message);
    }
  }, [call]);

  const load = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;

    setStatus("loading");
    setError("");

    // The roster loads beside the bookings, and on its own terms: a roster
    // that fails to load must not hide the bookings, only the assign picker.
    loadDrivers();

    try {
      const data = await call("/api/admin/bookings");
      setBookings(data.bookings ?? []);
      setAttention(data.attention ?? null);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [call, loadDrivers]);

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

  /*
   * Email and password, not a Google popup.
   *
   * A popup is the wrong shape for this: it is the owner signing in to his own
   * business on a phone, often the same phone the WhatsApp message arrived on,
   * and mobile browsers block or lose popups often enough that the failure has
   * no explanation he can act on. It also tied getting into his own bookings to
   * a Google account he may not want to keep using.
   *
   * There is no sign-up. Accounts are created in the Firebase console for an
   * address already in ADMIN_EMAILS, and the server checks that allowlist on
   * every request regardless of what happens here — see lib/admin-auth.js.
   */
  const signIn = async ({ email, password }) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
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
    return <SignIn onSignIn={signIn} onReset={resetPassword} />;
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

      <div className="mb-6 flex gap-1 rounded-full bg-ink/5 p-1 text-sm font-semibold" role="tablist">
        {[
          ["bookings", "Bookings"],
          ["drivers", `Drivers${drivers ? ` (${drivers.filter((d) => d.active !== false).length})` : ""}`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              view === key ? "bg-white text-ink shadow-card" : "text-ink/55 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "drivers" ? (
        <DriversPanel
          drivers={drivers}
          error={driversError}
          call={call}
          onChanged={loadDrivers}
        />
      ) : (
      <>
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
              drivers={drivers}
              driversError={driversError}
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
function BookingRow({ booking: b, open, onToggle, call, onChanged, drivers, driversError }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState("");
  const [rowError, setRowError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignWarnings, setAssignWarnings] = useState([]);
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

  const move = async (next, driverId) => {
    setBusy(next);
    setRowError("");
    try {
      const res = await call(`/api/admin/bookings/${b.reference}`, {
        method: "PATCH",
        body: JSON.stringify(driverId ? { status: next, driverId } : { status: next }),
      });
      setAssignWarnings(res.warnings ?? []);
      setAssignOpen(false);
      invalidate();
      await onChanged();
    } catch (err) {
      setRowError(err.message);
    } finally {
      setBusy("");
    }
  };

  // "Assign a driver" opens the picker instead of moving the status on its
  // own: the server will not accept "assigned" without a named driver.
  const onMove = (next) => {
    if (next === "assigned") {
      setAssignOpen(!assignOpen);
      return;
    }
    move(next);
  };

  const driverJob = b.driver ? buildDriverJobWhatsApp(b, b.driver) : null;
  const driverIntro = st === "assigned" ? buildDriverIntroWhatsApp(b) : null;

  const owed = (b.payment?.payableCents ?? 0) - (b.payment?.paidCents ?? 0);
  const legs = transferLegs(b);

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
          {/*
            One way or return, on the row rather than only in the expanded
            panel. A transfer's fare is double for a return, so "$40.00" in the
            Transport column is unreadable without it — and it decides whether
            the driver is doing one journey or two.
          */}
          <Field
            label={
              b.kind === "transfer"
                ? `Transfer${
                    directionOf(b) ? ` · ${describeDirection(directionOf(b))}` : ""
                  }`
                : "Tour"
            }
          >
            <span className="text-ink/80">{b.tourTitle || "—"}</span>
            {b.placeLabel && (
              <span className="block text-xs text-ink/50">{b.placeLabel}</span>
            )}
          </Field>
          <Field label="When">
            {b.kind === "transfer" ? (
              /* Arrival and departure each on their own lines: the departure
                 time is what Mr. Pugh sets the hotel pickup from. */
              [
                ["Arrival", legs.arrival],
                ["Departure", legs.departure],
              ]
                .filter(([, leg]) => leg)
                .map(([label, leg]) => (
                  <span key={label} className="block">
                    <span className="text-ink/80">
                      {label}: {formatDateTime(leg.date, leg.time) || "—"}
                    </span>
                    {leg.flight && (
                      <span className="block text-xs text-ink/50">
                        Flight {leg.flight}
                        {b.airline && ` · ${b.airline}`}
                      </span>
                    )}
                  </span>
                ))
            ) : (
              <>
                <span className="text-ink/80">{b.date || "—"}</span>
                {b.time && (
                  <span className="block text-xs text-ink/50">{formatTime12(b.time)}</span>
                )}
              </>
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
                onClick={() => onMove(next)}
                aria-expanded={next === "assigned" ? assignOpen : undefined}
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

        {(st === "assigned" || (st === "completed" && b.driver)) && (
          <div className="mt-3 rounded-xl bg-blue-50/70 p-3 text-sm">
            <p className="flex flex-wrap items-center gap-x-2 text-ink/80">
              <FaCarSide className="text-blue-700" aria-hidden="true" />
              {b.driver ? (
                <>
                  <span className="font-semibold text-ink">{b.driver.name}</span>
                  {(b.driver.vehicle || b.driver.plate) && (
                    <span className="text-xs text-ink/55">
                      {[b.driver.vehicle, b.driver.plate].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-ink/60">No driver recorded on this booking.</span>
              )}
            </p>
            {st === "assigned" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {driverJob && (
                  <a
                    href={driverJob}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-crimson-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-crimson-700"
                  >
                    <FaWhatsapp className="text-[0.7rem]" />
                    Send job to {b.driver.name.split(/\s+/)[0]}
                  </a>
                )}
                {driverIntro && (
                  <a
                    href={driverIntro}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 shadow-card transition hover:text-crimson-700"
                  >
                    <FaWhatsapp className="text-[0.7rem] text-whatsapp" />
                    Tell the guest who&apos;s coming
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setAssignOpen(!assignOpen)}
                  aria-expanded={assignOpen}
                  className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-ink/10"
                >
                  {b.driver ? "Change driver" : "Choose driver"}
                </button>
              </div>
            )}
            {assignWarnings.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-amber-800">
                {assignWarnings.map((w) => (
                  <li key={w}>⚠ {w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {assignOpen && (
          <AssignDriver
            booking={b}
            drivers={drivers}
            error={driversError}
            busy={busy === "assigned"}
            onAssign={(driverId) => move("assigned", driverId)}
            onCancel={() => setAssignOpen(false)}
          />
        )}

        {st === "completed" && (
          <ReviewRequest booking={b} call={call} onSent={onChanged} />
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
                    <FaWhatsapp className="text-xs text-whatsapp" />
                    WhatsApp
                  </a>
                </>
              )}
              <p className="pt-1 text-xs text-ink/45">
                Received {when(b.createdAt)}
              </p>
              {directionOf(b) && (
                <p className="text-xs text-ink/45">
                  {describeDirection(directionOf(b))}
                  {b.returnDate && ` · back ${formatDateTime(b.returnDate, b.returnTime)}`}
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
                      {STATUS_LABEL[h.status] ?? h.status}
                      {h.driver && `: ${h.driver}`}
                      {h.replaced && ` (was ${h.replaced})`} · {h.by} ·{" "}
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
 * Pick the driver for one booking.
 *
 * Every active driver is listed, with the same verdict the server will reach
 * (lib/drivers.js `canAssign`): a driver whose papers lapse before the job
 * ends is shown but cannot be chosen, and seats or missing papers are shown
 * as warnings the owner can overrule.
 */
function AssignDriver({ booking, drivers, error, busy, onAssign, onCancel }) {
  const active = (drivers ?? []).filter((d) => d.active !== false);
  const verdicts = active.map((d) => ({ d, v: canAssign(d, booking) }));
  const firstOk = verdicts.find(({ v }) => v.ok)?.d.id ?? "";
  const [choice, setChoice] = useState(
    verdicts.some(({ d, v }) => d.id === booking.driver?.id && v.ok) ? booking.driver.id : firstOk
  );
  const picked = verdicts.find(({ d }) => d.id === choice);

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-ink/10 bg-sand/60 p-3">
      <p className="text-xs font-semibold text-ink/70">Who is driving this job?</p>

      {error && <ErrorLine>{error}</ErrorLine>}

      {!drivers && !error && (
        <p className="flex items-center gap-2 text-xs text-ink/45">
          <FaSpinner className="animate-spin" /> Loading drivers…
        </p>
      )}

      {drivers && active.length === 0 && (
        <p className="text-xs text-ink/60">
          No drivers on the roster yet. Add them on the Drivers tab first.
        </p>
      )}

      {active.length > 0 && (
        <>
          <ul className="space-y-1.5" role="radiogroup" aria-label="Driver">
            {verdicts.map(({ d, v }) => (
              <li key={d.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    v.ok ? "hover:bg-white" : "cursor-not-allowed opacity-55"
                  } ${choice === d.id ? "bg-white shadow-card" : ""}`}
                >
                  <input
                    type="radio"
                    name={`driver-${booking.reference}`}
                    value={d.id}
                    checked={choice === d.id}
                    disabled={!v.ok}
                    onChange={() => setChoice(d.id)}
                    className="mt-1 accent-crimson-600"
                  />
                  <span>
                    <span className="font-semibold text-ink">{d.name}</span>
                    <span className="ml-1.5 text-xs text-ink/50">
                      {[d.vehicle, d.seats && `${d.seats} seats`].filter(Boolean).join(" · ")}
                    </span>
                    {!v.ok && <span className="block text-xs text-red-700">{v.reason}</span>}
                    {v.ok && v.warnings.length > 0 && (
                      <span className="block text-xs text-amber-800">{v.warnings.join(" ")}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAssign(choice)}
              disabled={!picked?.v.ok || busy}
              className="rounded-full bg-crimson-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-crimson-700 disabled:opacity-50"
            >
              {busy ? "Assigning…" : picked ? `Assign ${picked.d.name}` : "Assign"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/60 hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_DRIVER = {
  name: "",
  phone: "",
  vehicle: "",
  plate: "",
  seats: "",
  insuranceExpiry: "",
  licenceExpiry: "",
  notes: "",
  active: true,
};

/**
 * The roster: every driver PPP can send, their vehicle, and whether their
 * papers are current. Drivers are never deleted, only marked unavailable,
 * because past bookings name them.
 */
function DriversPanel({ drivers, error, call, onChanged }) {
  const [editing, setEditing] = useState(null); // null | "new" | driver id

  if (error) return <ErrorLine>{error}</ErrorLine>;
  if (!drivers) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink/50">
        <FaSpinner className="animate-spin" /> Loading drivers…
      </p>
    );
  }

  const sorted = [...drivers].sort(
    (a, b) => Number(b.active !== false) - Number(a.active !== false)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-prose text-sm text-ink/60">
          Every driver who can take a PPP job. A driver whose insurance or road
          licence has lapsed by the day of a job can&apos;t be assigned to it.
        </p>
        {editing !== "new" && (
          <button type="button" onClick={() => setEditing("new")} className="btn-primary">
            <FaPlus className="text-xs" /> Add a driver
          </button>
        )}
      </div>

      {editing === "new" && (
        <DriverForm
          initial={EMPTY_DRIVER}
          call={call}
          onSaved={async () => {
            setEditing(null);
            await onChanged();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {drivers.length === 0 && editing !== "new" && (
        <Notice>
          No drivers yet. Add Mr. Pugh, Noel and every standby driver, with
          their vehicle and the expiry dates of their insurance and road
          licence.
        </Notice>
      )}

      <ul className="space-y-3">
        {sorted.map((d) => {
          const docs = documentStatus(d);
          return (
            <li key={d.id} className="rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-card">
              {editing === d.id ? (
                <DriverForm
                  id={d.id}
                  initial={{ ...EMPTY_DRIVER, ...d, seats: d.seats ?? "" }}
                  call={call}
                  onSaved={async () => {
                    setEditing(null);
                    await onChanged();
                  }}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{d.name}</span>
                    {d.active === false ? (
                      <Badge tone="bg-ink/5 text-ink/50">Not available</Badge>
                    ) : !docs.ok ? (
                      <Badge tone="bg-red-50 text-red-700">Papers expired</Badge>
                    ) : docs.expiring.length || docs.missing.length ? (
                      <Badge tone="bg-gold-200/60 text-ink/70">Check papers</Badge>
                    ) : (
                      <Badge tone="bg-green-100 text-green-800">Ready</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(d.id)}
                      className="ml-auto text-xs font-semibold text-ink/50 hover:text-crimson-700"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <Field label="WhatsApp">
                      <span className="text-ink/80">{d.phone}</span>
                    </Field>
                    <Field label="Vehicle">
                      <span className="text-ink/80">
                        {[d.vehicle, d.plate].filter(Boolean).join(" · ") || "—"}
                      </span>
                      {d.seats && <span className="block text-xs text-ink/50">{d.seats} seats</span>}
                    </Field>
                    <Field label="Papers">
                      {DRIVER_DOCUMENTS.map(({ key, label }) => (
                        <span
                          key={key}
                          className={`block text-xs ${
                            docs.expired.includes(label)
                              ? "text-red-700"
                              : docs.expiring.includes(label) || !d[key]
                                ? "text-amber-800"
                                : "text-ink/60"
                          }`}
                        >
                          {label}: {d[key] ? `to ${d[key]}` : "not recorded"}
                        </span>
                      ))}
                    </Field>
                  </div>
                  {d.notes && <p className="mt-2 text-xs text-ink/55">{d.notes}</p>}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DriverForm({ id, initial, call, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const fid = (key) => `driver-${id ?? "new"}-${key}`;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await call(id ? `/api/admin/drivers/${id}` : "/api/admin/drivers", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      await onSaved();
    } catch (error) {
      setErr(error.message);
      setBusy(false);
    }
  };

  const input = (key, label, props = {}) => (
    <label htmlFor={fid(key)} className="block text-xs font-semibold text-ink/60">
      {label}
      <input
        id={fid(key)}
        value={form[key] ?? ""}
        onChange={set(key)}
        className="field mt-1"
        {...props}
      />
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2">
        {input("name", "Name", { required: true, autoComplete: "off" })}
        {input("phone", "WhatsApp number, with country code", {
          required: true,
          inputMode: "tel",
          placeholder: "+1 876 …",
          autoComplete: "off",
        })}
        {input("vehicle", "Vehicle", { placeholder: "e.g. White Toyota Hiace" })}
        {input("plate", "Plate", { placeholder: "PP …" })}
        {input("seats", "Guest seats", { type: "number", min: 1, max: 60, inputMode: "numeric" })}
        <span aria-hidden="true" className="hidden sm:block" />
        {input("insuranceExpiry", "Passenger insurance expires", { type: "date" })}
        {input("licenceExpiry", "Road licence / JTB licence expires", { type: "date" })}
      </div>
      <label htmlFor={fid("notes")} className="block text-xs font-semibold text-ink/60">
        Notes
        <textarea
          id={fid("notes")}
          value={form.notes ?? ""}
          onChange={set("notes")}
          rows={2}
          className="field mt-1"
          placeholder="Areas covered, languages, days off…"
        />
      </label>
      <label htmlFor={fid("active")} className="flex items-center gap-2 text-sm text-ink/70">
        <input
          id={fid("active")}
          type="checkbox"
          checked={form.active !== false}
          onChange={set("active")}
          className="accent-crimson-600"
        />
        Available for jobs
      </label>
      {err && <ErrorLine>{err}</ErrorLine>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saving…" : id ? "Save changes" : "Add driver"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Ask a guest for a Google review once the trip is done.
 *
 * WhatsApp is the main button because that is where Mr. Pugh already talks to
 * guests — it opens a ready-written message on his phone and he presses send.
 * Email is the fallback for guests without a WhatsApp number on file.
 */
function ReviewRequest({ booking: b, call, onSent }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const whatsapp = buildReviewRequestWhatsApp(b);

  const email = async () => {
    setBusy(true);
    setError("");
    try {
      await call(`/api/admin/bookings/${b.reference}/review`, { method: "POST" });
      await onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-gold-300 bg-gold-200/40 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
        <FaStar className="text-gold-500" />
        Ask for a Google review
        {b.reviewRequest?.at && (
          <span className="font-normal text-ink/45">
            · emailed {when(b.reviewRequest.at)}
          </span>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-crimson-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-crimson-700"
          >
            <FaWhatsapp className="text-[0.7rem]" />
            Send on WhatsApp
          </a>
        )}
        {b.email && (
          <button
            type="button"
            onClick={email}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 shadow-card transition hover:text-crimson-700 disabled:opacity-50"
          >
            <FaEnvelope className="text-[0.65rem]" />
            {busy ? "Sending…" : b.reviewRequest?.at ? "Email again" : "Send by email"}
          </button>
        )}
      </div>
      {error && <ErrorLine>{error}</ErrorLine>}
    </div>
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

/**
 * The sign-in screen.
 *
 * Its own component and its own state, so a half-typed password is not sitting
 * in the state of the page that lists every guest's phone number.
 *
 * Firebase's error codes are reported as its own sentences by default, which
 * range from unhelpful ("auth/invalid-credential") to alarming for someone who
 * has simply mistyped. They are translated here into what the person can
 * actually do next, and a wrong address and a wrong password deliberately give
 * the same message — telling an anonymous visitor which addresses exist is
 * exactly the enumeration the allowlist is there to prevent.
 */
function SignIn({ onSignIn, onReset }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const explain = (code, fallback) => {
    if (code === "auth/invalid-email") return "That doesn't look like an email address.";
    if (code === "auth/user-disabled") return "That account has been disabled.";
    if (code === "auth/too-many-requests")
      return "Too many attempts. Wait a few minutes, or reset the password below.";
    if (code === "auth/network-request-failed")
      return "Couldn't reach the server. Check your connection and try again.";
    if (code === "auth/operation-not-allowed")
      return "Email sign-in is not switched on for this Firebase project yet.";
    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "That email and password don't match.";
    }
    return fallback ?? "Sign-in failed.";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr("Enter your email and password.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await onSignIn({ email: email.trim(), password });
      // No success state: the auth listener swaps this whole screen out.
    } catch (e2) {
      setErr(explain(e2?.code, e2?.message));
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!email.trim()) {
      setErr("Enter your email first, then tap this again.");
      return;
    }
    setErr("");
    try {
      await onReset(email.trim());
    } catch {
      // Deliberately swallowed. Whether the address exists is not something an
      // unauthenticated visitor gets to learn from the outcome of this button.
    }
    setSent(true);
  };

  return (
    <div className="card mx-auto max-w-sm p-7">
      <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
        Your bookings, payments and drivers.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="admin-email" className="label">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="label">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>

        {err && <ErrorLine>{err}</ErrorLine>}

        {sent && (
          <p className="rounded-xl bg-green-50 px-3.5 py-2.5 text-sm leading-relaxed text-green-800">
            If that address has an account, a reset link is on its way to it.
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? <FaSpinner className="animate-spin" /> : <FaLock className="text-xs" />}
          Sign in
        </button>
      </form>

      <button
        type="button"
        onClick={reset}
        className="mt-4 w-full text-center text-xs font-semibold text-crimson-700 underline"
      >
        Forgotten your password?
      </button>

      <p className="mt-5 border-t border-ink/[0.07] pt-4 text-xs leading-relaxed text-ink/45">
        Accounts are set up for you — there is nothing to sign up for here. If
        you cannot get in, the address has to be listed in{" "}
        <code className="text-ink/60">ADMIN_EMAILS</code>.
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
