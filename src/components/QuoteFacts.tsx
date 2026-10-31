import { effectiveCost, formatINR } from '../engine';
import type { Quote } from '../schemas';

const NOT_STATED = 'Not stated';
const rupees = (v: number | null) => (v === null ? NOT_STATED : formatINR(v));

/** The fields extracted from a quote, with "Not stated" wherever the vendor said nothing. */
export function QuoteFacts({ quote, guests }: { quote: Quote; guests: number }) {
  const rows: [string, string][] = [
    ['Vendor', quote.vendorName ?? NOT_STATED],
    ['Total price', rupees(quote.totalPrice)],
    ['Price per plate', rupees(quote.pricePerPlate)],
    ['Guest minimum', quote.guestMinimum === null ? NOT_STATED : String(quote.guestMinimum)],
    ['Overtime fee per hour', rupees(quote.overtimeFeePerHour)],
    [
      'Tax included',
      quote.taxIncluded === null ? NOT_STATED : quote.taxIncluded ? 'Yes' : 'No, extra',
    ],
    ['Advance', quote.advancePercent === null ? NOT_STATED : `${quote.advancePercent}%`],
    ['Inclusions', quote.inclusions.length ? quote.inclusions.join(', ') : NOT_STATED],
    ['Exclusions', quote.exclusions.length ? quote.exclusions.join(', ') : NOT_STATED],
    ['Cancellation', quote.cancellationPolicy ?? NOT_STATED],
  ];
  const cost = effectiveCost(quote, guests);
  return (
    <div className="overflow-hidden rounded-xl border border-line/70 bg-card shadow-xs">
      <table className="w-full">
        <caption className="sr-only">Details found in the quotation</caption>
        <tbody className="divide-y divide-line/60">
          {rows.map(([k, v]) => (
            <tr key={k} className="transition-colors hover:bg-paper/40">
              <th scope="row" className="w-2/5 px-3 py-2 text-xs font-semibold text-ink-soft">
                {k}
              </th>
              <td className="px-3 py-2 text-xs text-ink">{v}</td>
            </tr>
          ))}
          <tr className="bg-accent-soft/40">
            <th scope="row" className="px-3 py-2.5 text-xs font-bold text-ink">
              Effective cost for {guests} guests
            </th>
            <td className="px-3 py-2.5 text-sm font-extrabold text-accent">
              {cost === null ? 'Cannot be worked out yet' : formatINR(cost)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
