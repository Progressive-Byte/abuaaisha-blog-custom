import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageIntro } from "@/components/PageIntro";
import { SITE } from "@/lib/site";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "যোগাযোগ",
  description: "প্রশ্ন, মতামত বা কাউন্সেলিং সেশন বুক করতে বার্তা পাঠান।",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div className={`container ${styles.narrow}`}>
      <PageIntro
        title="যোগাযোগ করুন"
        lede="আপনার প্রশ্ন বা প্রয়োজনের কথা লিখুন—সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।"
      />
      <ContactForm idPrefix="page" />
      <p className={styles.direct}>
        অথবা সরাসরি ইমেইল করুন: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
    </div>
  );
}
