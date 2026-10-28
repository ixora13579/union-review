import Link from "next/link";
import { Suspense } from "react";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NoProfile } from "./no-profile";

async function DemandCount() {
  if (!(await getProfile())) return <NoProfile />;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("demands")
    .select("*", { count: "exact", head: true });

  if (error) {
    return <p className="text-red-600">요구안 개수를 불러오지 못했습니다.</p>;
  }

  return <p className="text-lg">요구안 {count ?? 0}건</p>;
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">노조 요구안 검토 관리</h1>
      <Suspense fallback={<p className="text-lg text-gray-500">불러오는 중…</p>}>
        <DemandCount />
      </Suspense>
      <Link
        href="/demands"
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        요구안 목록 보기
      </Link>
    </main>
  );
}
