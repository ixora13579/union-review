import Link from "next/link";
import { NewDemandForm } from "./new-demand-form";

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
      <NewDemandForm />
    </main>
  );
}
