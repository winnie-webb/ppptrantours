"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps `form` mirrored into `sessionStorage` under `key`, and restores it on
 * mount — 08_IMPLEMENTATION_PLAN.md Phase 4's "draft persistence". Guest
 * details are the most annoying field group to retype, and a phone losing
 * the tab (a call, switching apps to check a flight number) is the ordinary
 * case this exists for, not the exception.
 *
 * Session-scoped, not local-storage: a draft is for finishing THIS booking
 * attempt, not something that should reappear weeks later on a different
 * tour's form. `clearBookingDraft` removes it once the booking succeeds, so
 * the next visit starts blank.
 */
export function useBookingDraft(key, form, setForm) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const saved = window.sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed }));
      }
    } catch {
      // Private mode, or a corrupt value. The form just starts blank.
    }
    // key/setForm are stable for the life of one booking form instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(form));
    } catch {
      /* not fatal */
    }
  }, [key, form]);
}

export function clearBookingDraft(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* not fatal */
  }
}
