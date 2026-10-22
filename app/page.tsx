"use client";

import { useEffect, useState } from "react";

type EventOption = { slug: string; name: string };

type CheckInResult = {
  event_slug: string;
  event_name: string;
  delegate_name: string;
  checked_in_at: string;
  already_checked_in: boolean;
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

function Success({ result, onReset }: { result: CheckInResult; onReset: () => void }) {
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
      <p className="status">{result.already_checked_in ? "Already checked in" : "Checked in"}</p>
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
      <button type="button" className="link-button" onClick={onReset}>
        Check in to another event
      </button>
    </div>
  );
}

export default function CheckInPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [event, setEvent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: EventOption[]) => setEvents(data))
      .catch(() => setError("Couldn't load events. Please see an organizer."));

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) {
      setError("Please choose the event you're attending.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, event })
      });
      const data = await res.json();
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

  return (
    <main className="page">
      <div className="brand">
        <img src="/GoldLogo.png" alt="SSICSIM" />
        <span>Event Check-in</span>
      </div>

      {result ? (
        <Success
          result={result}
          onReset={() => {
            setResult(null);
            setEvent("");
          }}
        />
      ) : (
        <form className="card" onSubmit={onSubmit}>
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

          <fieldset>
            <legend>Event you're attending</legend>
            <div className="events">
              {events.map((ev) => (
                <label
                  key={ev.slug}
                  className={`event-option${event === ev.slug ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="event"
                    value={ev.slug}
                    checked={event === ev.slug}
                    onChange={() => setEvent(ev.slug)}
                  />
                  {ev.name}
                </label>
              ))}
            </div>
          </fieldset>

          <button className="submit" type="submit" disabled={submitting}>
            {submitting ? "Checking in…" : "Check in"}
          </button>
        </form>
      )}
    </main>
  );
}
