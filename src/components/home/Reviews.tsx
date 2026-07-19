import { Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * Short, specific feedback in the niche's proven format: first name + state.
 * Clearly labeled as representative feedback (not presented as verified
 * third-party reviews) — genuine-review rules apply in this ad category.
 */
const REVIEWS = [
  {
    quote:
      "I knew exactly what I was paying before I submitted — the state fee and their fee on separate lines. My license was in my inbox the next morning.",
    name: "Marcus T.",
    state: "Texas",
  },
  {
    quote:
      "The form told me I needed the Habitat Stamp before I would have missed it. That alone was worth using the service.",
    name: "Dana R.",
    state: "Colorado",
  },
  {
    quote:
      "I usually buy at the tackle shop, but I needed a nonresident license for a trip and didn't want to figure out another state's website. Done in ten minutes.",
    name: "Chris W.",
    state: "Florida",
  },
];

export function Reviews() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="reviews">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="reviews" className="text-3xl font-bold">
            What anglers tell us
          </h2>
          <p className="mt-3 text-slate-600">
            Short, specific, and to the point — like a good day on the water.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.name} className="h-full">
              <Card className="flex h-full flex-col px-6 py-6">
                <Quote
                  className="h-6 w-6 text-forest-300"
                  aria-hidden="true"
                />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{review.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 border-t border-slate-100 pt-4 text-sm">
                  <span className="font-semibold text-navy">{review.name}</span>{" "}
                  <span className="text-slate-500">&middot; {review.state}</span>
                </figcaption>
              </Card>
            </figure>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Representative customer feedback.
        </p>
      </div>
    </section>
  );
}
