import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_STYLES: Record<string, string> = {
  검토중: "bg-gray-100 text-gray-700",
  수용: "bg-green-100 text-green-700",
  일부수용: "bg-blue-100 text-blue-700",
  수용곤란: "bg-red-100 text-red-700",
};

const FEASIBILITY_STYLES: Record<string, string> = {
  가능: "bg-green-100 text-green-700",
  조건부: "bg-yellow-100 text-yellow-800",
  곤란: "bg-red-100 text-red-700",
};

type WorkplaceReview = {
  id: number;
  workplace_name: string;
  current_status: string | null;
  feasibility: string | null;
  opinion: string | null;
};

type Demand = {
  id: number;
  demand_no: string;
  category: string;
  title: string;
  union_request: string | null;
  prev_2024_request: string | null;
  prev_2024_result: string | null;
  bargaining_subject: string | null;
  bargaining_opinion: string | null;
  mgmt_right: string | null;
  mgmt_right_opinion: string | null;
  budget_required: string | null;
  budget_amount: number | null;
  budget_opinion: string | null;
  legal_review: string | null;
  legal_opinion: string | null;
  status: string;
  workplace_reviews: WorkplaceReview[];
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 p-5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

function Text({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="text-gray-400">-</span>;
}

function Badge({ value, styles }: { value: string; styles?: Record<string, string> }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-sm font-medium ${styles?.[value] ?? "bg-blue-50 text-blue-700"}`}
    >
      {value}
    </span>
  );
}

// 판정이 비어 있으면 "미검토"로 회색 표시
function Verdict({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-400">
        미검토
      </span>
    );
  }
  return <Badge value={value} />;
}

function StepCard({
  title,
  verdict,
  opinion,
  children,
}: {
  title: string;
  verdict: string | null;
  opinion: string | null;
  children?: ReactNode;
}) {
  return (
    <Card title={title}>
      <dl className="flex flex-col gap-3">
        <Field label="판정">
          <Verdict value={verdict} />
        </Field>
        {children}
        <Field label="의견">
          <Text value={opinion} />
        </Field>
      </dl>
    </Card>
  );
}

async function DemandDetail({ id }: { id: string }) {
  if (!/^\d+$/.test(id)) notFound();

  const { data, error } = await supabase
    .from("demands")
    .select("*, workplace_reviews(id, workplace_name, current_status, feasibility, opinion)")
    .eq("id", id)
    .order("id", { referencedTable: "workplace_reviews" })
    .maybeSingle();

  if (error) {
    return <p className="text-red-600">요구안을 불러오지 못했습니다.</p>;
  }
  if (!data) notFound();

  const demand = data as Demand;

  return (
    <>
      <Card title="기본정보">
        <dl className="flex flex-col gap-3">
          <Field label="요구안번호">{demand.demand_no}</Field>
          <Field label="분야">{demand.category}</Field>
          <Field label="제목">{demand.title}</Field>
          <Field label="노조 요구내용">
            <Text value={demand.union_request} />
          </Field>
          <Field label="상태">
            <Badge value={demand.status} styles={STATUS_STYLES} />
          </Field>
        </dl>
      </Card>

      <Card title="1단계 24년도 요구안">
        <dl className="flex flex-col gap-3">
          <Field label="24년 요구 내용">
            <Text value={demand.prev_2024_request} />
          </Field>
          <Field label="24년 결과">
            <Verdict value={demand.prev_2024_result} />
          </Field>
        </dl>
      </Card>

      <StepCard
        title="2단계 교섭대상 판단"
        verdict={demand.bargaining_subject}
        opinion={demand.bargaining_opinion}
      />

      <StepCard
        title="3단계 인사경영권 침해"
        verdict={demand.mgmt_right}
        opinion={demand.mgmt_right_opinion}
      />

      <StepCard
        title="4단계 예산수반"
        verdict={demand.budget_required}
        opinion={demand.budget_opinion}
      >
        <Field label="추정액(연간)">
          {demand.budget_amount === null ? (
            <span className="text-gray-400">-</span>
          ) : (
            `${demand.budget_amount.toLocaleString("ko-KR")}원`
          )}
        </Field>
      </StepCard>

      <StepCard
        title="5단계 법적검토"
        verdict={demand.legal_review}
        opinion={demand.legal_opinion}
      />

      <Card title="6단계 현장실효성">
        {demand.workplace_reviews.length === 0 ? (
          <Verdict value={null} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500">
                  <th className="px-3 py-2 font-medium">사업장</th>
                  <th className="px-3 py-2 font-medium">현장현황</th>
                  <th className="px-3 py-2 font-medium">실행가능성</th>
                  <th className="px-3 py-2 font-medium">의견</th>
                </tr>
              </thead>
              <tbody>
                {demand.workplace_reviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-200">
                    <td className="whitespace-nowrap px-3 py-2">{review.workplace_name}</td>
                    <td className="px-3 py-2">
                      <Text value={review.current_status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {review.feasibility ? (
                        <Badge value={review.feasibility} styles={FEASIBILITY_STYLES} />
                      ) : (
                        <Verdict value={null} />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Text value={review.opinion} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export default function DemandDetailPage({ params }: PageProps<"/demands/[id]">) {
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
      <h1 className="text-2xl font-bold">요구안 상세</h1>
      <Suspense fallback={<p className="text-gray-500">불러오는 중…</p>}>
        {params.then(({ id }) => (
          <DemandDetail id={id} />
        ))}
      </Suspense>
    </main>
  );
}
