"use client";

import { useEffect, useState } from "react";

export type EventOption = { slug: string; name: string };

// Sessions that have ended or are full come back with `unavailable` set and
// are shown greyed out.
type WalkInOffer = {
  message: string;
  sessions: { key: string; label: string; unavailable: string | null }[];
};

type CheckInResult = {
  event_name: string;
  delegate_name: string;
  checked_in_at: string;
  already_checked_in: boolean;
  walk_in: boolean;
};

const STORAGE_KEY = "ssicsim-checkin-details";

function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Ticking clock so an organizer can tell this is a live screen, not a screenshot.
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      {now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
      })}
    </>
  );
}

function Success({ result }: { result: CheckInResult }) {
  return (
    <div className="card success">
      <div className="check" aria-hidden>
        <svg viewBox="0 0 52 52" fill="none">
          <path
            d="M14 27l8 8 16-17"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="status">
        {result.already_checked_in
          ? "Already checked in"
          : result.walk_in
            ? "Added & checked in"
            : "Checked in"}
      </p>
      <p className="name">{result.delegate_name}</p>
      <p className="event-name">{result.event_name}</p>
      <div className="meta">
        <div>
          Checked in
          <strong>{formatTime(result.checked_in_at)}</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          Now
          <strong>
            <LiveClock />
          </strong>
        </div>
      </div>
      <p className="hint">Show this screen to an organizer.</p>
    </div>
  );
}

export function CheckInForm({ event, checkInKey }: { event: EventOption; checkInKey: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  // Not signed up for the event, but it has space: the delegate can confirm
  // to be added. Training lists its sessions to pick from.
  const [offer, setOffer] = useState<WalkInOffer | null>(null);

  useEffect(() => {
    // Prefill from a previous check-in so the next event is one tap.
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setFirstName(saved.firstName ?? "");
        setLastName(saved.lastName ?? "");
        setEmail(saved.email ?? "");
      }
    } catch {
      // storage unavailable; the form just starts empty
    }
  }, []);

  async function checkIn(walkIn = false, session: string | null = null) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          event: event.slug,
          key: checkInKey,
          walk_in: walkIn,
          session
        })
      });
      const data = await res.json();
      if (res.status === 409 && data.code === "walk_in_available") {
        setOffer({ message: data.message, sessions: data.sessions ?? [] });
        return;
      }
      setOffer(null);
      if (!res.ok) {
        setError(data.message ?? "Something went wrong. Please see an organizer.");
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ firstName, lastName, email }));
      } catch {
        // ignore
      }
      setResult(data);
    } catch {
      setError("Couldn't reach check-in. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    checkIn();
  }

  return result ? (
    <Success result={result} />
  ) : offer ? (
    <div className="card">
      <p className="event-badge">{event.name}</p>
      <h1>Join this event?</h1>
      <p className="subtitle">{offer.message}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="offer-actions">
        {offer.sessions.length ? (
          offer.sessions.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`submit${s.unavailable ? " unavailable" : ""}`}
              disabled={submitting || Boolean(s.unavailable)}
              onClick={() => checkIn(true, s.key)}
            >
              {s.label}
              {s.unavailable ? ` · ${s.unavailable}` : ""}
            </button>
          ))
        ) : (
          <button
            type="button"
            className="submit"
            disabled={submitting}
            onClick={() => checkIn(true)}
          >
            {submitting ? "Checking in…" : "Add me and check me in"}
          </button>
        )}
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setOffer(null);
            setError(null);
          }}
        >
          Go back
        </button>
      </div>
    </div>
  ) : (
    <form className="card" onSubmit={onSubmit}>
      <p className="event-badge">{event.name}</p>
      <h1>Check in</h1>
      <p className="subtitle">
        Use the name and email you registered with. Then show the green screen to an
        organizer.
      </p>

      {error ? <p className="error">{error}</p> : null}

      <div className="row">
        <div className="field">
          <label htmlFor="first">First name</label>
          <input
            id="first"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="last">Last name</label>
          <input
            id="last"
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button className="submit" type="submit" disabled={submitting}>
        {submitting ? "Checking in…" : "Check in"}
      </button>
    </form>
  );
}
