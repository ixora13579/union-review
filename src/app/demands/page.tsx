import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["검토중", "수용", "일부수용", "수용곤란"] as const;

const STATUS_STYLES: Record<string, string> = {
  검토중: "bg-gray-100 text-gray-700",
  수용: "bg-green-100 text-green-700",
  일부수용: "bg-blue-100 text-blue-700",
  수용곤란: "bg-red-100 text-red-700",
};

type Demand = {
  id: number;
  demand_no: string;
  category: string;
  title: string;
  status: string;
  bargaining_subject: string | null;
  mgmt_right: string | null;
  budget_required: string | null;
  legal_review: string | null;
};

// 2~5단계(교섭대상, 인사경영권, 예산, 법적검토) 중 판정된 단계 수
function reviewedSteps(demand: Demand) {
  return [
    demand.bargaining_subject,
    demand.mgmt_right,
    demand.budget_required,
    demand.legal_review,
  ].filter((value) => value !== null).length;
}

function ReviewProgress({ done }: { done: number }) {
  return (
    <span className="tracking-widest" aria-label={`4단계 중 ${done}단계 판정 완료`}>
      {"●".repeat(done)}
      {"○".repeat(4 - done)}
    </span>
  );
}

async function DemandList() {
  const { data, error } = await supabase
    .from("demands")
    .select(
      "id, demand_no, category, title, status, bargaining_subject, mgmt_right, budget_required, legal_review",
    )
    .order("demand_no");

  if (error) {
    return <p className="text-red-600">요구안 목록을 불러오지 못했습니다.</p>;
  }

  const demands = data as Demand[];

  return (
    <>
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{status}</p>
            <p className="mt-1 text-2xl font-bold">
              {demands.filter((demand) => demand.status === status).length}건
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th className="px-3 py-2 font-medium">요구안번호</th>
              <th className="px-3 py-2 font-medium">분야</th>
              <th className="px-3 py-2 font-medium">제목</th>
              <th className="px-3 py-2 font-medium">상태</th>
              <th className="px-3 py-2 font-medium">검토 진행</th>
            </tr>
          </thead>
          <tbody>
            {demands.map((demand) => (
              <tr key={demand.id} className="border-b border-gray-200">
                <td className="whitespace-nowrap px-3 py-2">{demand.demand_no}</td>
                <td className="whitespace-nowrap px-3 py-2">{demand.category}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/demands/${demand.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {demand.title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[demand.status] ?? ""}`}
                  >
                    {demand.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <ReviewProgress done={reviewedSteps(demand)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {demands.length === 0 && (
          <p className="py-8 text-center text-gray-500">등록된 요구안이 없습니다.</p>
        )}
      </section>
    </>
  );
}

export default function DemandsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">요구안 목록</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            처음으로
          </Link>
          <Link
            href="/demands/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            요구안 등록
          </Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-gray-500">불러오는 중…</p>}>
        <DemandList />
      </Suspense>
    </main>
  );
}
