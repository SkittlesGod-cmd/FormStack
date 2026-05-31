"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const CHROMELESS = ["/f/"];

export function SiteChrome() {
  const path = usePathname();
  const hide = CHROMELESS.some(prefix => path.startsWith(prefix));
  if (hide) return null;
  return (
    <>
      <Navbar />
    </>
  );
}

export function SiteFooter() {
  const path = usePathname();
  const hide = CHROMELESS.some(prefix => path.startsWith(prefix));
  if (hide) return null;
  return <Footer />;
}
