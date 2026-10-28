// 2~5단계 검토 항목. 판정값은 supabase/schema.sql 의 check 조건과 같아야 한다.
export type ReviewStepKey = "bargaining" | "mgmt" | "budget" | "legal";

type ReviewStep = {
  title: string;
  verdictColumn: string;
  opinionColumn: string;
  amountColumn?: string;
  options: readonly string[];
};

export const REVIEW_STEPS: Record<ReviewStepKey, ReviewStep> = {
  bargaining: {
    title: "2단계 교섭대상 판단",
    verdictColumn: "bargaining_subject",
    opinionColumn: "bargaining_opinion",
    options: ["의무교섭", "임의교섭", "교섭대상아님"],
  },
  mgmt: {
    title: "3단계 인사경영권 침해",
    verdictColumn: "mgmt_right",
    opinionColumn: "mgmt_right_opinion",
    options: ["없음", "일부", "침해"],
  },
  budget: {
    title: "4단계 예산수반",
    verdictColumn: "budget_required",
    opinionColumn: "budget_opinion",
    amountColumn: "budget_amount",
    options: ["미수반", "수반"],
  },
  legal: {
    title: "5단계 법적검토",
    verdictColumn: "legal_review",
    opinionColumn: "legal_opinion",
    options: ["적법", "위법소지", "추가검토"],
  },
};
