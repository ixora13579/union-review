import Link from "next/link";

export default function DemandDetailPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <Link href="/demands" className="text-sm text-gray-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-2xl font-bold">요구안 상세</h1>
      <p className="text-gray-500">상세 페이지는 준비 중입니다.</p>
    </main>
  );
}
