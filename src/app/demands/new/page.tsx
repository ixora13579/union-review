import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getProfile, isNegotiator } from "@/lib/auth";
import { NewDemandForm } from "./new-demand-form";

// 요구안 등록은 교섭담당만 할 수 있다. 주소로 직접 들어오면 목록으로 돌려보낸다.
async function NegotiatorOnly({ children }: { children: React.ReactNode }) {
  if (!isNegotiator(await getProfile())) redirect("/demands");
  return children;
}

export default function NewDemandPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-8">
      <div>
        <Link
          href="/demands"
          className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← 목록으로
        </Link>
      </div>
      <h1 className="text-2xl font-bold">요구안 등록</h1>
      <Suspense fallback={<p className="text-gray-500">불러오는 중…</p>}>
        <NegotiatorOnly>
          <NewDemandForm />
        </NegotiatorOnly>
      </Suspense>
    </main>
  );
}
