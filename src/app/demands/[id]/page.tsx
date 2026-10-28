import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { BasicInfoCard } from "./basic-info-card";
import { DeleteDemandButton } from "./delete-demand-button";
import { ReviewStepCard } from "./review-step-card";
import { Card } from "./ui";
import { WorkplaceReviews, type WorkplaceReview } from "./workplace-reviews";

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
      <BasicInfoCard
        demandId={demand.id}
        demandNo={demand.demand_no}
        category={demand.category}
        title={demand.title}
        unionRequest={demand.union_request}
        status={demand.status}
      />

      <ReviewStepCard
        demandId={demand.id}
        step="prev2024"
        verdict={demand.prev_2024_result}
        opinion={demand.prev_2024_request}
      />

      <ReviewStepCard
        demandId={demand.id}
        step="bargaining"
        verdict={demand.bargaining_subject}
        opinion={demand.bargaining_opinion}
      />

      <ReviewStepCard
        demandId={demand.id}
        step="mgmt"
        verdict={demand.mgmt_right}
        opinion={demand.mgmt_right_opinion}
      />

      <ReviewStepCard
        demandId={demand.id}
        step="budget"
        verdict={demand.budget_required}
        opinion={demand.budget_opinion}
        amount={demand.budget_amount}
      />

      <ReviewStepCard
        demandId={demand.id}
        step="legal"
        verdict={demand.legal_review}
        opinion={demand.legal_opinion}
      />

      <Card title="6단계 현장실효성">
        <WorkplaceReviews demandId={demand.id} reviews={demand.workplace_reviews} />
      </Card>

      <DeleteDemandButton
        demandId={demand.id}
        demandNo={demand.demand_no}
        title={demand.title}
        reviewCount={demand.workplace_reviews.length}
      />
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
