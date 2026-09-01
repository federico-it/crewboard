"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), rememberMe: false }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? "Too many attempts. Try again in a minute." : response.status >= 500 ? "Sign-in is unavailable. Check the database and server configuration." : "Email or password is incorrect.");
        return;
      }
      router.replace("/attendance");
      router.refresh();
    } catch { setError("Unable to connect. Please try again."); }
    finally { setPending(false); }
  }
  return <main className="attendance-app login-page">
    <section className="login-card">
      <p className="brand">C / CREWBOARD</p>
      <h1>Your working day,<br />in one place.</h1>
      <p>Sign in to review and correct your attendance. Your browser agent uses the same records.</p>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue="alex@crewboard.example" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        {error && <p role="alert" className="error-message">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="muted">Demo accounts are provisioned by the operator. All seeded records are fictional; public signup is disabled.</p>
      <Link href="/spike">Open the original WebMCP spike</Link>
    </section>
  </main>;
}
