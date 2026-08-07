"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { faqs } from "../data/site";

export default function FaqAccordion({ items = faqs }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-ink/[0.07] overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-crimson-50/60"
              >
                <span className="font-display text-[1.05rem] font-semibold text-ink">
                  {item.q}
                </span>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                    isOpen ? "rotate-45 bg-crimson-600 text-white" : "bg-ink/5 text-ink/60"
                  }`}
                >
                  <FaPlus className="text-xs" />
                </span>
              </button>
            </h3>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-6 pr-16 text-[0.95rem] leading-relaxed text-ink/65">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
