"use client";

import Link from "next/link";

export default function AttendanceError({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: 40 }}>
      <h1>Attendance unavailable</h1>
      <p role="alert">Check your employee access or ask the operator to check database configuration and migrations.</p>
      <button onClick={reset}>Try again</button>
      <p>
        <Link href="/login">Return to sign in</Link>
      </p>
    </main>
  );
}
