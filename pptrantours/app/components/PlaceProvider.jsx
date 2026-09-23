"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPlace } from "@/app/data/places";

/**
 * Where the guest is staying, remembered across the whole visit.
 *
 * This is the one question the site needs answered before it can quote
 * anything, because the owner's transport prices change with the pickup point.
 * Asking it once and keeping the answer means every card, table and form after
 * that shows a real price for *this* guest instead of a "from" figure.
 *
 * Stored in localStorage, not a cookie: it never needs to reach the server —
 * pages are static and the price maths runs in the browser — and keeping it out
 * of request headers keeps every page cacheable.
 */

const STORAGE_KEY = "ppp.place";

const PlaceContext = createContext(null);

export function PlaceProvider({ children }) {
  const [placeKey, setPlaceKey] = useState(null);
  // Server-rendered HTML cannot know the stored place, so the first client
  // paint must match it. Everything place-dependent waits for this.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      /*
       * Reading an external store on mount is the case this rule cannot see:
       * the value does not exist during render, and the server render must not
       * depend on it. `ready` below is what gates every consumer.
       */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored && getPlace(stored)) setPlaceKey(stored);
    } catch {
      // Private mode, or storage disabled. The site works without it.
    }
    setReady(true);
  }, []);

  /*
   * How many times the guest has picked a resort *in this page session*.
   *
   * A restored value and a chosen one are the same string, and the booking
   * form has to tell them apart: a resort carried over from an earlier visit
   * must be confirmed before it can be booked against, while one the guest
   * just picked obviously needs no second agreement. Zero means everything on
   * screen came out of storage.
   *
   * Session-scoped on purpose — it is not persisted, so a new page load starts
   * at zero and asks again.
   */
  const [choiceCount, setChoiceCount] = useState(0);

  const choose = useCallback((key) => {
    setPlaceKey(key);
    setChoiceCount((n) => n + 1);
    try {
      if (key) window.localStorage.setItem(STORAGE_KEY, key);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* not fatal */
    }
  }, []);

  const value = useMemo(() => {
    const place = placeKey ? getPlace(placeKey) : null;
    return {
      ready,
      place,
      placeKey,
      zone: place?.zone ?? null,
      choose,
      choiceCount,
      clear: () => choose(null),
    };
  }, [placeKey, ready, choose, choiceCount]);

  return (
    <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
  );
}

export function usePlace() {
  const ctx = useContext(PlaceContext);
  if (!ctx) throw new Error("usePlace must be used inside a PlaceProvider");
  return ctx;
}
