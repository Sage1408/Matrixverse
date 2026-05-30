import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Search Traders",
  description: "Find and follow traders on MatrixVerse.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchClient />
    </Suspense>
  );
}
