# 09 — Owner Decisions (2026-09-23)

**Where docs 01–08 disagree with this file, this file wins.**

| # | Question | Decision | Supersedes |
|---|---|---|---|
| Q-01 | Transfer directions | **Three options: Airport → hotel · Hotel → airport · Round trip.** Both one-way directions cost the same (the hotel's one-way price). Keep it as simple as possible. | 02/05: "Both ways" becomes **"Round trip"** |
| Q-02 | Departure pickup time | **PPP sets it from the flight time.** The form asks for departure date + flight time + flight number (optional) and says "We'll tell you your hotel pickup time." | — |
| Q-03 | Unlisted hotels | **No guessed prices, ever.** Build a hotel list covering most of Jamaica, with each hotel assigned to a priced area, and charge by area. A hotel that can't be assigned to a priced area isn't bookable online; the guest is sent to WhatsApp. | 02/07: no "About $X" estimate. The unlisted path becomes "My hotel isn't listed → message us on WhatsApp" (no free-text booking) |
| Q-04 | Area prices | Use the rates PPP already has. For areas PPP hasn't priced, take them from `winnie-webb/islandwaystours` **only where the price is unambiguous** (see table below). | — |
| Q-05 | Price wording in booking | **Show the total only.** Never "per person", "at least 4" or "minimum 4" in the booking flow. The existing 1–4 explanation stays in the FAQ. | 05 §3 pattern: the price panel shows **"$80 total"** plus the party and direction, e.g. "Round trip · 2 people". No "+$20 each extra" line |
| — | Tour card price | **Per person on cards**, to draw people in: "From $10 per person". The booking shows the total. | 05 §3 tour card rows |
| Q-06 | Children | **Under 5 ride free** and don't count toward the total. Everyone 5+ counts the same. | Form: "People (5 and over)" + "Children under 5 (free)" |
| Q-07 | Cancellation terms | Terms stay on the site (/terms, footer) but are **not linked in the booking flow**. Keep the flow uncluttered. | 02/08: drop the terms link beside the button |
| Q-08 | Availability | **Instant confirmation.** Remove "days sell out", "we confirm availability first" and similar. | — |
| Q-09 | Coverage | **MBJ only.** No cruise-pier transfers, no Kingston airport. Remove the "cruise ports" promise from transfer copy; piers remain tour pickups. | — |
| Q-10 | Tour pickup time | **PPP sets it.** The form says "We'll confirm your pickup time"; preferences go in the notes. The pickup-time field is removed. | — |
| Q-11 | Currency | **USD only.** "Pay the driver in cash (US dollars)". No JMD mention. | — |
| Q-12 | Flight number | **Required for airport pickups** (Airport → hotel, and the arrival leg of Round trip). Optional for Hotel → airport. | — |

---

## Transfer price areas (one-way, per person; total = rate × 4 for 1–4 people, rate × people for 5+)

### From PPP's current list (owner-supplied, unchanged)
Current hotels keep their current rates. The 46 hotels fall into these tiers:

| Tier (internal) | One way | Current hotels (examples) |
|---|---|---|
| MoBay A | $5 | Toby, Royal Decameron Cornwall, S Hotel, Deja, Club MoBay, Altamont, Hotel 39, Caribic House |
| MoBay B | $7.50 | Secrets ×2, Breathless, Sandals MoBay, Riu ×3, Sandals Royal Caribbean, Zoetry |
| MoBay C / Rose Hall | $10 | Half Moon, Jewel Grande, Iberostar ×3, Round Hill |
| Hanover (Tryall) | $12.50 | Tryall Club |
| Falmouth A / Green Island | $15 | Excellence Oyster Bay, Riu Aquarelle, Royalton Blue Waters, Grand Palladium ×2 |
| Falmouth B | $17.50 | Ocean Eden Bay, Ocean Coral Spring |
| Falmouth C | $20 | Bahia Principe, FDR |
| Ocho Rios / Negril beach / Princess | $25 | 6 Ocho Rios hotels, Negril Seven Mile Beach, Princess Grand |
| Ocho east / Negril West End / South Coast | $30 | Couples ×2, Negril West End, Sandals South Coast |
| GoldenEye | $42.50 | GoldenEye |

New hotels are assigned to one of these tiers by location. **Every new assignment is listed for owner review before launch**; nothing goes live unreviewed.

### From islandwaystours (areas PPP hasn't priced)
Used **only** where the lowest price is exactly half the highest, which means one-way and round-trip per-person prices:

| Area | One way | Round trip | Status |
|---|---|---|---|
| Runaway Bay | $18 | $36 | **Usable** |
| Lucea | $15 | $30 | **Usable** |

**Not usable without owner confirmation** (these are ranges, not a single price):

| Area | Listed | Why not |
|---|---|---|
| Braco | $16 / $33 | Not an exact 2× pair |
| Treasure Beach | $40 / $75 | Range |
| Kingston area (from MBJ) | $75 / $125 | Range |
| Port Antonio & Mandeville | $50 / $160 | Range covering two different areas |

**Conflicts: PPP's rate wins.** Islandways lists Negril $22 (PPP $25/$30), Ocho Rios $24 (PPP $25–$42.50), Falmouth $15 (PPP $15–$20), and Montego Bay $5–$30 (PPP $5–$10).

**Action for owner:**
1. Confirm one-way prices for Braco, Treasure Beach, Kingston area, Port Antonio and Mandeville, or leave them unbookable online.
2. Review the tier assignment of each newly added hotel.
