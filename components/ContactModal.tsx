"use client";

import { useEffect, useRef } from "react";
import { ContactForm } from "./ContactForm";
import { Icon } from "./Icon";
import { SITE } from "@/lib/site";
import styles from "./ContactModal.module.css";

export function ContactModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onClick = (event: MouseEvent) => {
      const opener = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-contact-open]");
      if (!opener) return;
      event.preventDefault();
      const subject = dialog.querySelector<HTMLSelectElement>("[data-contact-subject]");
      const wanted = opener.dataset.subject;
      if (subject && wanted) subject.value = wanted;
      if (typeof dialog.showModal === "function") dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    };

    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    const onClose = () => {
      document.documentElement.style.overflow = "";
    };

    // Capture phase so preventDefault runs before Next's <Link> handler starts navigation.
    document.addEventListener("click", onClick, true);
    dialog.addEventListener("click", onBackdrop);
    dialog.addEventListener("close", onClose);
    return () => {
      document.removeEventListener("click", onClick, true);
      dialog.removeEventListener("click", onBackdrop);
      dialog.removeEventListener("close", onClose);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.modal} aria-labelledby="contact-modal-title">
      <div className={styles.top}>
        <span className={styles.badge}>
          <Icon name="mail" size={26} />
        </span>
        <div>
          <h2 id="contact-modal-title">যোগাযোগ করুন</h2>
          <p>আপনার প্রশ্ন বা প্রয়োজনের কথা লিখুন—সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।</p>
        </div>
        <button className={styles.close} type="button" onClick={() => dialogRef.current?.close()}>
          <Icon name="close" size={22} label="বন্ধ করুন" />
        </button>
      </div>

      <div className={styles.scrollArea}>
        <ContactForm idPrefix="modal" />

        <div className={styles.or} role="separator">
          <span>অথবা</span>
        </div>

        <a className={styles.direct} href={`mailto:${SITE.email}`}>
          <span className={styles.directBadge}>
            <Icon name="mail" size={20} />
          </span>
          <span className={styles.directText}>
            <span>সরাসরি ইমেইল করুন</span>
            <strong>{SITE.email}</strong>
          </span>
          <Icon name="arrow-up-right" size={22} />
        </a>
      </div>
    </dialog>
  );
}
