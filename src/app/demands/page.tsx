import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { DEMAND_CATEGORIES, DEMAND_STATUSES } from "@/lib/review-steps";
import { DemandFilters, type Filters } from "./demand-filters";

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

// 주소의 검색 조건을 읽는다. 목록에 없는 값은 무시한다.
function readFilters(searchParams: Record<string, string | string[] | undefined>): Filters {
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  const category = first(searchParams.category);
  const status = first(searchParams.status);
  return {
    category: (DEMAND_CATEGORIES as readonly string[]).includes(category) ? category : "",
    status: (DEMAND_STATUSES as readonly string[]).includes(status) ? status : "",
    q: first(searchParams.q),
  };
}

function filtersHref(filters: Filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "") params.set(key, value);
  }
  const query = params.toString();
  return query ? `/demands?${query}` : "/demands";
}

async function DemandList({ filters }: { filters: Filters }) {
  let query = supabase
    .from("demands")
    .select(
      "id, demand_no, category, title, status, bargaining_subject, mgmt_right, budget_required, legal_review",
    )
    .order("demand_no");

  if (filters.category !== "") {
    query = query.eq("category", filters.category);
  }
  if (filters.q !== "") {
    // %, _ 를 글자 그대로 검색하도록 이스케이프
    query = query.ilike("title", `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`);
  }

  const { data, error } = await query;

  if (error) {
    return <p className="text-red-600">요구안 목록을 불러오지 못했습니다.</p>;
  }

  // 상태 카드 개수는 분야·검색 조건만 반영하고, 표는 상태 조건까지 반영한다
  const matched = data as Demand[];
  const demands =
    filters.status === ""
      ? matched
      : matched.filter((demand) => demand.status === filters.status);

  return (
    <>
      <DemandFilters {...filters} />

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {DEMAND_STATUSES.map((status) => {
          const selected = filters.status === status;
          return (
            <Link
              key={status}
              // 선택된 카드를 다시 누르면 상태 조건을 해제한다
              href={filtersHref({ ...filters, status: selected ? "" : status })}
              aria-current={selected ? "true" : undefined}
              className={`rounded-lg border p-4 hover:bg-gray-50 ${
                selected ? "border-blue-600 ring-2 ring-blue-600" : "border-gray-200"
              }`}
            >
              <p className="text-sm text-gray-500">{status}</p>
              <p className="mt-1 text-2xl font-bold">
                {matched.filter((demand) => demand.status === status).length}건
              </p>
            </Link>
          );
        })}
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
          <p className="py-8 text-center text-gray-500">
            {filtersHref(filters) === "/demands"
              ? "등록된 요구안이 없습니다."
              : "조건에 맞는 요구안이 없습니다."}
          </p>
        )}
      </section>
    </>
  );
}

export default function DemandsPage({ searchParams }: PageProps<"/demands">) {
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
        {searchParams.then((params) => (
          <DemandList filters={readFilters(params)} />
        ))}
      </Suspense>
    </main>
  );
}
