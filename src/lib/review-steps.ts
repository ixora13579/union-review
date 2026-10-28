// 1~5단계 검토 항목. 판정값은 supabase/schema.sql 의 check 조건과 같아야 한다.
export type ReviewStepKey = "prev2024" | "bargaining" | "mgmt" | "budget" | "legal";

type ReviewStep = {
  title: string;
  verdictColumn: string;
  opinionColumn: string;
  amountColumn?: string;
  options: readonly string[];
  // 기본값은 "판정"/"의견", 판정이 먼저 나온다
  verdictLabel?: string;
  opinionLabel?: string;
  opinionFirst?: boolean;
};

// 1단계 24년 결과(demands.prev_2024_result)
export const PREV_2024_RESULTS = ["수용", "일부수용", "불수용", "신규"] as const;

export const REVIEW_STEPS: Record<ReviewStepKey, ReviewStep> = {
  prev2024: {
    title: "1단계 24년도 요구안",
    verdictColumn: "prev_2024_result",
    opinionColumn: "prev_2024_request",
    options: PREV_2024_RESULTS,
    verdictLabel: "24년 결과",
    opinionLabel: "24년 요구 내용",
    opinionFirst: true,
  },
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

// 요구안 종합 상태(demands.status)
export const DEMAND_STATUSES = ["검토중", "수용", "일부수용", "수용곤란"] as const;

// 6단계 사업장 회신 실행가능성(workplace_reviews.feasibility)
export const FEASIBILITY_OPTIONS = ["가능", "조건부", "곤란"] as const;

// 요구안 분야(demands.category). DB에는 제약이 없고 화면에서만 이 목록으로 제한한다.
export const DEMAND_CATEGORIES = ["휴가", "복지", "근로시간", "인사", "노조활동", "임금"] as const;

// 사업장 목록. 사업장담당 프로필의 workplace_name, 회신의 workplace_name 과 글자가 같아야 한다.
export const WORKPLACES = ["가상 A사업소", "가상 B사업소", "가상 C사업소"] as const;
