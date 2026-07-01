import Link from "next/link";
import SearchBox from "@/app/components/SearchBox";

export default function NotFound() {
  return (
    <section className="block">
      <div className="container prose">
        <h1 className="section-title">We don&apos;t have that one… yet</h1>
        <p className="section-sub">
          The word, name, or brand you&apos;re after isn&apos;t in the corpus.
          Try a search, or browse a category — the list grows every build.
        </p>
        <SearchBox />
        <div className="notice" style={{ marginTop: 24 }}>
          <Link href="/">Back to the home page</Link>
        </div>
      </div>
    </section>
  );
}
