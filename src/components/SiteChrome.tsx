"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocaleProvider } from "@/i18n/LocaleProvider";

/** Hides the public marketing chrome on /admin routes. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <LocaleProvider>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </LocaleProvider>
  );
}
