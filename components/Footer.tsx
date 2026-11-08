import Link from "next/link";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { NAV, SITE } from "@/lib/site";
import { toBanglaDigits } from "@/lib/format";
import styles from "./Footer.module.css";

export function Footer() {
  const year = toBanglaDigits(new Date().getFullYear());

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo tone="dark" />
            <p>{SITE.description}</p>
            <Link className="btn btn--light" href="/counseling/#sessions">
              সেশন বুক করুন
              <Icon name="arrow-right" />
            </Link>
          </div>

          <div className={styles.columns}>
            <nav aria-labelledby="footer-pages">
              <h2 id="footer-pages">পাতা</h2>
              <ul>
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h2>যোগাযোগ</h2>
              <ul className={styles.contact}>
                <li>
                  <a href={`mailto:${SITE.email}`}>
                    <Icon name="mail" size={20} />
                    {SITE.email}
                  </a>
                </li>
                <li>
                  <Link href="/contact/" data-contact-open="">
                    <Icon name="chat" size={20} />
                    বার্তা পাঠান
                  </Link>
                </li>
                <li>
                  <a href={SITE.linkedin.url} rel="me noopener" target="_blank">
                    <Icon name="linkedin" size={20} />
                    লিংকডইন
                  </a>
                </li>
                <li>
                  <a href={SITE.youtube.url} rel="me noopener" target="_blank">
                    <Icon name="youtube" size={20} />
                    ইউটিউব
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>
            © {year} {SITE.name}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <a href="#top" className={styles.toTop}>
            উপরে ফিরে যান <Icon name="arrow-up" size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
