import Image from "next/image";

/**
 * Three numbered steps, each paired with real photography.
 * Numbered steps (not icon soup) per the process-section pattern.
 */
const STEPS = [
  {
    image: "/images/fly-casting.jpg",
    alt: "Angler casting a fly rod while wading in a river",
    title: "Tell us where you're fishing",
    body: "Choose your state and residency, then pick from the state's current license options at official prices. Required stamps and validations are added automatically.",
  },
  {
    image: "/images/tackle-detail.jpg",
    alt: "Close-up of an angler's hand on a spinning reel by the water",
    title: "Complete one guided form",
    body: "Plain-English questions with inline validation that catches mistakes as you type. You see the state fee and our service fee itemized before you pay.",
  },
  {
    image: "/images/lake-morning.jpg",
    alt: "Misty sunrise over a still lake with a small dock",
    title: "We review, purchase, and deliver",
    body: "A real person checks your application — usually within 1 business day — purchases your license from the state portal, and emails it as soon as the state issues it.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="border-y border-slate-200/80 bg-slate-50 py-16 sm:py-20"
      aria-labelledby="how-it-works"
    >
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-it-works" className="text-3xl font-bold">
            How it works
          </h2>
          <p className="mt-3 text-slate-600">
            Three simple steps between you and the water.
          </p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white ring-2 ring-white/80"
                >
                  {i + 1}
                </span>
              </div>
              <div className="px-6 py-5">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
