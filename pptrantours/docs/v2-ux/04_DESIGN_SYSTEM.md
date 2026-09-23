# 04 — Design System

Keep the brand: crimson `#a80424`, gold `#f1d72d`, warm ink `#150a0d`, sand, **Plus Jakarta Sans** (UI) and **Fraunces** (display). The fonts load correctly (verified). The problems are **scale, hierarchy, contrast and consistency**, not identity.

Everything below goes into `tailwind.config.js` and `app/globals.css` as tokens and component classes, so components stop using one-off values like `text-[0.68rem]` and `text-ink/40`.

---

## 1. Typography

### Problems found
| Evidence | Issue |
|---|---|
| BookingForm section headings measured at **10.88px, Fraunces, ink/40**; the field labels under them at **12px, ink/70** | Headings weaker than labels (F-40) |
| `globals.css:26` gives *every* h1–h3 Fraunces | Small functional headings become tiny serif caps (F-61) |
| 38 uses of `text-[0.65rem]`, `[0.68rem]`, `[0.7rem]` | No scale, and sizes under 12px (F-62) |
| /tour h1 is 30px on mobile, the same as section h2s; the slogan `<p>` is 64px | Page title doesn't dominate; decoration outranks structure |
| `.label` is 12px, uppercase, `tracking-wider` | Small uppercase is slow to read, and it's used on every field (F-67) |

### Recommended scale
Mobile values first, then desktop (≥1024px). Line heights are unitless.

| Token | Use | Font | Size | Weight | Line height | Colour |
|---|---|---|---|---|---|---|
| `display` | Homepage hero H1 only | Fraunces | 36 → 56 | 600 | 1.1 | white / ink |
| `h1` | Page title (one per page) | Fraunces | 30 → 44 | 600 | 1.15 | ink |
| `h2` | Section heading | Fraunces | 24 → 32 | 600 | 1.2 | ink |
| `h3` | Card title, form section, sub-section | **Sans** | 18 → 20 | 700 | 1.3 | ink |
| `body-lg` | Lead paragraph (max 1 per section) | Sans | 18 | 400 | 1.55 | ink/80 |
| `body` | Default text | Sans | 16 | 400 | 1.6 | ink/80 |
| `label` | Form labels | Sans | 15 | 600 | 1.4 | ink | *(sentence case, not uppercase)* |
| `small` | Helper text, card metadata | Sans | 14 | 400 | 1.5 | **ink/70 minimum** |
| `caption` | Legal, timestamps (sparingly) | Sans | 13 | 500 | 1.4 | ink/70 |
| `eyebrow` | Optional kicker above an h2 | Sans | 13 | 600 | 1.3 | crimson-700, uppercase, `tracking-[0.12em]` |
| `price` | Price totals | Sans, `tabular-nums` | 32 → 36 | 700 | 1 | ink (on light) / gold-400 (on ink) |
| `price-sm` | Card "From $40" | Sans | 18 | 700 | 1.2 | ink |

**Rules**
1. **Nothing under 13px, and never under 14px for anything a user must read to complete a task** (labels, errors, helper text, prices).
2. Fraunces is used **only** for `display`, `h1`, `h2`. Change the global rule in `globals.css` to `h1, h2 { font-display }`. `h3` becomes sans bold.
3. A heading is always larger **and** at least as dark as the text it introduces.
4. Each page has one `h1`, then `h2` sections and `h3` sub-sections. No skipped levels. Uppercase eyebrows are **optional decoration** and never replace a heading.
5. Body copy line length is at most 70 characters (`max-w-prose`).

---

## 2. Colour and contrast

| Token | Value | On white | Use |
|---|---|---|---|
| `text-primary` | ink `#150a0d` | 19:1 | Headings, labels, prices |
| `text-secondary` | ink/80 | ≈10:1 | Body |
| `text-muted` | **ink/70** | ≈7:1 | Helper, metadata. **The lightest text allowed on white** |
| `text-disabled` | ink/45 | ≈3.1:1 | Disabled controls only (exempt), never content |
| `brand` | crimson-600 `#a80424` | ≈7.7:1 | Primary buttons, links, selected states |
| `brand-strong` | crimson-700 | ≈9.7:1 | Error text, eyebrow |
| `accent` | gold-400 | **≈1.4:1 on white** | **Only on ink backgrounds** (price on dark, hero accents). Never text on white or sand |
| `success` | new: green-700 `#15803d` | ≈5:1 | "Selected ✓", "Paid" |
| `surface` | white / sand `#fbf7f4` | — | Cards / alternate sections |

**Rules**
- **Stop using `text-ink/40`, `/45`, `/50` and `/55` for readable text** (about 85 instances, F-60). Map them to `text-muted` (ink/70). Where the text is truly unimportant, delete it rather than fade it.
- On ink backgrounds, the lightest text is `white/70`.
- Meaning is never carried by colour alone: selected = colour **+** ✓ icon **+** "Selected" text for screen readers. Errors = red **+** icon **+** message.
- WhatsApp FAB: use a darker green `#0f7a3f` (≈5.4:1 with white), or keep brand green with an ink icon.

---

## 3. Spacing and layout
- Base unit 4px. Use Tailwind's default scale; no arbitrary values.
- Section rhythm: `py-12` mobile, `py-20` desktop. Fewer sections (03) matters more than tighter spacing.
- Card padding: `p-5` mobile, `p-8` desktop.
- Form field vertical gap: `space-y-5`. Gap between form sections: `mt-8`, with an `h3` and a hairline.
- Mobile gutter: 20px (current `.shell`, keep).

---

## 4. Buttons

| Variant | Class | Look | Use |
|---|---|---|---|
| Primary | `.btn-primary` | crimson-600 fill, white text | **One per screen**: the main next step |
| Secondary | `.btn-secondary` (rename of `.btn-ghost`) | white, ink/20 border, ink text | Alternatives ("See tours", "Chat on WhatsApp") |
| On-dark | `.btn-gold` | gold-400 fill, ink text | Primary on ink or hero backgrounds only |
| Text | `.btn-link` | crimson-700, underline on hover and focus | Tertiary ("Change", "Edit") |

**Specs**
- **Min height 48px** on mobile and 44px on desktop, with 16px text and weight 600.
- Form submit buttons and Stage-1 buttons are **full-width on mobile**.
- Every interactive element gets `focus-visible:outline-2 outline-offset-2 outline-crimson-600`, not only `.btn`. Put it in the base layer for `a, button, [role=button], input, select, textarea, summary`.
- Loading state: spinner + "Booking…". The button is disabled, **keeps its width**, and sets `aria-busy`.
- Labels are verb + object (+ price where known): "Book transfer · $80", "See tours", "Continue · $80". See 05.

---

## 5. Forms

| Element | Spec |
|---|---|
| Label | Above the field, `label` token, sentence case. Required fields are marked with " *" plus a note "* required" at the top of the form. Optional fields add "(optional)" instead, when there are fewer optional fields than required ones |
| Input / select | Height 48px, 16px text **at every breakpoint** (drop `sm:text-sm`, so the size is consistent), border ink/25 (currently /15, which is too faint to see the field edge), radius 12px |
| Focus | 2px crimson-600 border + `focus-visible` outline. Replace the 10%-opacity ring |
| Placeholder | Example format only ("AA 1573"), never instructions. Colour ink/60 |
| Helper text | Below the field, `small` token, linked with `aria-describedby` |
| Error | Below the field, **14px** crimson-700, with a ⚠ icon, `aria-invalid="true"`, and linked with `aria-describedby`. After submit, an error summary at the top with anchor links (keep the current "focus first error") |
| Date + time pairs | **Stacked on mobile** (`grid-cols-1 sm:grid-cols-2`). Side by side they truncate at 375px (F-41) |
| Stepper | Buttons **44 × 44px**, value 18px bold, `aria-live="polite"` on the value |
| Segmented control (direction, payment) | Each option ≥ 48px tall, full-width row on mobile, `role="radiogroup"` / radio semantics, selected = crimson fill + ✓ |
| Selected-value card (hotel) | See 07 §4. 16px bold name, 14px area, ✓ icon, "Change" link-button (44px target) |
| Price panel | `price` token + one-line qualifier (`small`) + included ticks. `aria-live="polite"` |
| Summary card | Sand background, rows of label / value (`small` / `body`), total in the `price` token |

---

## 6. Components to standardise
| Component | Current | Target |
|---|---|---|
| `SectionHeading` | eyebrow 0.7rem + h2 + description ink/60 | `eyebrow` optional, `h2` token, `body-lg` ink/80 |
| `TourCard` | 7 text elements, subtitle xs ink/40 | image, h3 title, duration (small, muted), price-sm, "View tour" |
| Form section heading | h3 0.68rem ink/40 Fraunces | `h3` token (18px sans bold, ink) |
| PlacePicker group label | h3 0.68rem ink/40 | `caption` uppercase ink/70, as a `role="presentation"` group label |
| Footer column heading | h3 text-sm Fraunces | `h3`-small: 15px sans bold |
| `.eyebrow` | 0.7rem, 0.2em tracking | 13px, 0.12em, crimson-700 |

---

## 7. Accessibility baseline (WCAG 2.2 AA)
- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for text 24px+ or 18.66px bold+). Non-text UI (borders, icons conveying state) ≥ 3:1.
- [ ] Touch targets ≥ 44 × 44px (2.5.8 minimum is 24px; we choose 44 for this audience).
- [ ] Skip link "Skip to content" linking to `<main id="main">`.
- [ ] Visible `focus-visible` style on every interactive element. No `outline: none` without a replacement.
- [ ] Every input has a programmatic label. Search inputs get visible labels or `aria-label`.
- [ ] Modals and sheets (mobile menu, hotel search): `role="dialog"`, `aria-modal`, labelled, focus trapped, Escape closes, focus returned to the trigger.
- [ ] Hotel search follows the WAI-ARIA **combobox + listbox** pattern (07 §4).
- [ ] FAQ: native `<details>/<summary>`, or `aria-expanded` + `aria-controls` + `hidden` on collapsed panels.
- [ ] Live regions for price updates and form errors.
- [ ] `prefers-reduced-motion` respected (already done, keep). The hero auto-rotation pauses on focus or hover and has a pause control, or is removed.
- [ ] Heading order is correct on every template.
- [ ] Don't rely on colour alone for selected, error or paid states.
