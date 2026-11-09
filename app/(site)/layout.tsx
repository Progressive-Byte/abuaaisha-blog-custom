import { BackToTop } from "@/components/BackToTop";
import { ContactModal } from "@/components/ContactModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        মূল লেখায় যান
      </a>
      <Header />
      <main id="main" lang="bn">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <ContactModal />
    </>
  );
}
