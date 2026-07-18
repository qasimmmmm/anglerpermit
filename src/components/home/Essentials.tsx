import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * "Know before you fish" — plain-English fishing-license essentials.
 * Editorial alternating rows with real photography. Doubles as the
 * educational content anglers search for before buying.
 */
const ROWS = [
  {
    image: "/images/fresh-catch.jpg",
    alt: "Angler holding a freshly caught rainbow trout",
    title: "Resident or nonresident? Annual or short-term?",
    points: [
      "Residents pay the lowest annual price; nonresidents are always welcome but pay more. If you're visiting, most states sell 1-day to week-long licenses that cost far less than an annual one.",
      "Fish more than a few times a year? An annual license usually pays for itself quickly.",
      "Age matters: children fish free in most states (the cutoff varies — under 17 in Texas, under 16 in many others), and seniors often qualify for reduced fees.",
    ],
  },
  {
    image: "/images/bass-catch.jpg",
    alt: "Largemouth bass caught on a frog lure, held above the water",
    title: "Stamps, validations, and report cards",
    points: [
      "The base license isn't always the whole cost. Colorado requires a Habitat Stamp with your first license purchase each season; California requires report cards for steelhead, sturgeon, and salmon, plus a validation to fish a second rod in inland waters.",
      "Saltwater, trout, and other special fisheries often carry their own endorsements, depending on the state.",
      "Our forms add legally required items to your application automatically — you can't accidentally under-buy.",
    ],
  },
  {
    image: "/images/river-dusk.jpg",
    alt: "Fly angler wading a river at dusk with mountains behind",
    title: "Why states ask for your SSN — and when licenses expire",
    points: [
      "Federal child-support enforcement law requires states to collect a Social Security number with recreational license applications. Where a state requires it, we transmit it encrypted and mask it everywhere except the application itself.",
      "License years aren't always calendar years: most Texas annual licenses expire August 31 no matter when you buy, and Colorado's season runs March 1 through the following March 31.",
      "We show each license's exact validity dates before you pay, so there are no surprises at the water.",
    ],
  },
];

export function Essentials() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="essentials">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-600">
            Know before you fish
          </p>
          <h2 id="essentials" className="mt-3 text-3xl font-bold">
            Fishing license essentials, in plain English
          </h2>
          <p className="mt-3 text-slate-600">
            The rules that trip anglers up most — explained before you apply, not
            after a warden asks.
          </p>
        </div>

        <div className="mt-12 space-y-12">
          {ROWS.map((row, i) => (
            <div
              key={row.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              <div
                className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-card ${
                  i % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <Image
                  src={row.image}
                  alt={row.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <h3 className="text-xl font-semibold sm:text-2xl">{row.title}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {row.points.map((point) => (
                    <li key={point.slice(0, 32)} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-forest-500"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link
            href="/states"
            className="text-sm font-semibold text-forest-700 hover:text-forest-500"
          >
            Check your state&apos;s licenses, fees, and requirements
            <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
}
