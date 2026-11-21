"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Icon } from "./Icon";
import { CONTACT_SUBJECTS } from "@/lib/site";
import { toBanglaDigits } from "@/lib/format";
import styles from "./ContactForm.module.css";

const SESSION_BOOKING_PREFIX = "সেশন বুকিং:";

const SESSION_TERMS = [
  "এই সেশনটি ইসলামিক মূল্যবোধ ও বাস্তব অভিজ্ঞতার আলোকে পরিচালিত একটি পরামর্শমূলক সেবা, কোনো চিকিৎসা নয়।",
  "গুরুতর মানসিক সমস্যা থাকলে অবশ্যই চিকিৎসক বা সাইকিয়াট্রিস্টের পরামর্শ নিন। এই সেশন চিকিৎসার বিকল্প নয়।",
  "আত্মহত্যার চিন্তা বা জরুরি পরিস্থিতিতে সেশনের জন্য অপেক্ষা না করে নিকটস্থ হাসপাতাল বা জরুরি সেবার সাহায্য নিন।",
  "সেশনে শেয়ার করা আপনার ব্যক্তিগত কথাগুলো গোপন রাখা হবে। তবে কারও নিরাপত্তার ঝুঁকি বা আইনগত প্রয়োজন থাকলে ব্যতিক্রম হতে পারে।",
  "সেশনে আলোচনা করা বিষয়ের ভিত্তিতে আপনার নেওয়া সিদ্ধান্তের দায়ভার আপনার নিজের।",
  "গোপনীয়তা বজায় রাখতে সেশনের কোনো অডিও, ভিডিও রেকর্ডিং বা স্ক্রিনশট নেওয়া যাবে না।",
  "সেশন পরিবর্তন করতে অন্তত ২৪ ঘণ্টা আগে জানাতে হবে। এর কম সময়ে বাতিল করলে বা সেশনে উপস্থিত না থাকলে ফি ফেরত দেওয়া হবে না।",
  "সেশনে অংশগ্রহণের জন্য আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে।",
];

export function ContactForm({ idPrefix, compact = false }: { idPrefix: string; compact?: boolean }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState<string>(CONTACT_SUBJECTS[0]);
  const [consented, setConsented] = useState(false);
  const isSessionBooking = subject.startsWith(SESSION_BOOKING_PREFIX);

  function onSubjectChange(value: string) {
    setSubject(value);
    if (!value.startsWith(SESSION_BOOKING_PREFIX)) setConsented(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    if (isSessionBooking && !consented) return;
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
      setSubject(CONTACT_SUBJECTS[0]);
      setConsented(false);
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
    <form className={`${styles.form} ${compact ? styles.compact : ""}`} onSubmit={onSubmit}>
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
          <select
            id={id("subject")}
            name="subject"
            data-contact-subject
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
          >
            {CONTACT_SUBJECTS.map((option) => (
              <option value={option} key={option}>
                {option}
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

      {isSessionBooking ? (
        <div className={styles.consent}>
          <details className={styles.terms}>
            <summary className={styles.termsSummary}>শর্তাবলি দেখুন</summary>
            <ol className={styles.termsList} role="list">
              {SESSION_TERMS.map((term, index) => (
                <li key={term}>{`${toBanglaDigits(index + 1)}. ${term}`}</li>
              ))}
            </ol>
          </details>

          <label className={styles.checkbox} htmlFor={id("consent")}>
            <input
              id={id("consent")}
              name="consent"
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
              required
            />
            <span>আমি সেশন সম্পর্কিত শর্তাবলি পড়েছি, বুঝেছি এবং সম্মত আছি।</span>
          </label>
        </div>
      ) : null}

      <button
        className="btn btn--primary btn--block"
        type="submit"
        disabled={status === "sending" || (isSessionBooking && !consented)}
      >
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
