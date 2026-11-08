"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Icon } from "./Icon";
import { CONTACT_SUBJECTS } from "@/lib/site";
import styles from "./ContactForm.module.css";

export function ContactForm({ idPrefix }: { idPrefix: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: data.get("subject"),
          message: data.get("message"),
          botField: data.get("bot-field"),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "বার্তা পাঠানো যায়নি।");
      form.reset();
      setStatus("success");
      const successMessage =
        "ধন্যবাদ! আপনার সেশন বুকিংয়ের অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের টিম ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবে।";
      setMessage(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : "দুঃখিত! আপনার সেশন বুকিংয়ের অনুরোধটি পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।";
      setStatus("error");
      setMessage(reason);
      toast.error(reason);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <p className="visually-hidden">
        <label>
          এই ঘরটি পূরণ করবেন না:
          <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={id("name")}>আপনার নাম</label>
          <div className={styles.input}>
            <Icon name="user" size={20} />
            <input id={id("name")} name="name" type="text" placeholder="নাম লিখুন" autoComplete="name" required />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor={id("email")}>ইমেইল ঠিকানা</label>
          <div className={styles.input}>
            <Icon name="mail" size={20} />
            <input
              id={id("email")}
              name="email"
              type="email"
              placeholder="example@mail.com"
              autoComplete="email"
              inputMode="email"
              required
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={id("phone")}>
          ফোন নম্বর <span className={styles.optional}>(ঐচ্ছিক)</span>
        </label>
        <div className={styles.input}>
          <Icon name="phone" size={20} />
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            placeholder="+880 1XXX-XXXXXX"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={id("subject")}>বিষয়</label>
        <div className={`${styles.input} ${styles.selectInput}`}>
          <Icon name="chat" size={20} />
          <select id={id("subject")} name="subject" data-contact-subject>
            {CONTACT_SUBJECTS.map((subject) => (
              <option value={subject} key={subject}>
                {subject}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={20} className={styles.chevron} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={id("message")}>আপনার বার্তা</label>
        <textarea id={id("message")} name="message" rows={5} placeholder="এখানে বিস্তারিত লিখুন…" required />
      </div>

      <button className="btn btn--primary btn--block" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "পাঠানো হচ্ছে…" : "বার্তা পাঠান"}
        <Icon name="send" />
      </button>

      <p className={styles.privacy}>
        <Icon name="lock" size={18} />
        আপনার তথ্য সম্পূর্ণ গোপন রাখা হবে।
      </p>

      {status !== "idle" ? (
        <p
          className={`${styles.status} ${status === "error" ? styles.error : ""}`}
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {status === "sending" ? "বার্তা পাঠানো হচ্ছে…" : message}
        </p>
      ) : null}
    </form>
  );
}
