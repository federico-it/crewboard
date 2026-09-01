import Link from "next/link";

export default function About() {
  return <div className="spike"><main><p className="eyebrow">Crewboard / lifecycle check</p>
    <h1>No tool on this page.</h1>
    <p>The attendance component is unmounted here. Its WebMCP registration should be removed.</p>
    <Link href="/spike">Back to spike</Link><p><Link href="/attendance">Open attendance workspace</Link></p>
  </main></div>;
}
