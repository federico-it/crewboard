import Link from "next/link";

export default function About() {
  return <main><p className="eyebrow">Crewboard / lifecycle check</p>
    <h1>No tool on this page.</h1>
    <p>The attendance component is unmounted here. Its WebMCP registration should be removed.</p>
    <Link href="/">Back to spike</Link>
  </main>;
}
