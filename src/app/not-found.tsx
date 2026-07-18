import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="container-site max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest-600">404</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get
          you back on track.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonClasses("primary", "lg")}>
            Back to home
          </Link>
          <Link href="/states" className={buttonClasses("outline", "lg")}>
            Browse states
          </Link>
        </div>
      </div>
    </section>
  );
}
