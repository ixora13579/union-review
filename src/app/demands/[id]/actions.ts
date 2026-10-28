"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { authorize, type Profile } from "@/lib/auth";
import {
  DEMAND_CATEGORIES,
  DEMAND_STATUSES,
  FEASIBILITY_OPTIONS,
  REVIEW_STEPS,
  WORKPLACES,
  type ReviewStepKey,
} from "@/lib/review-steps";

export type SaveResult = { ok: true } | { ok: false; error: string };

// 요구안 자체(기본정보·상태·1~5단계·삭제)는 교섭담당만 바꿀 수 있다
const NEGOTIATOR = ["교섭담당"] as const;

export async function updateReviewStep(formData: FormData): Promise<SaveResult> {
  const auth = await authorize(NEGOTIATOR);
  if (!auth.ok) return auth;

  const demandId = Number(formData.get("demandId"));
  const stepKey = String(formData.get("step"));

  if (!Number.isInteger(demandId) || !(stepKey in REVIEW_STEPS)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const step = REVIEW_STEPS[stepKey as ReviewStepKey];
  const verdict = String(formData.get("verdict") ?? "");
  const opinion = String(formData.get("opinion") ?? "").trim();

  // 빈 값은 "미검토"로 되돌린다는 뜻
  if (verdict !== "" && !step.options.includes(verdict)) {
    return { ok: false, error: "허용되지 않는 판정값입니다." };
  }

  const values: Record<string, string | number | null> = {
    [step.verdictColumn]: verdict || null,
    [step.opinionColumn]: opinion || null,
  };

  if (step.amountColumn) {
    const amount = String(formData.get("amount") ?? "").replace(/[,\s]/g, "");
    if (amount !== "" && !/^\d+$/.test(amount)) {
      return { ok: false, error: "추정액은 숫자만 입력하세요." };
    }
    if (amount !== "" && !Number.isSafeInteger(Number(amount))) {
      return { ok: false, error: "추정액이 너무 큽니다." };
    }
    values[step.amountColumn] = amount === "" ? null : Number(amount);
  }

  const { data, error } = await auth.supabase
    .from("demands")
    .update(values)
    .eq("id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `저장하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "저장할 요구안을 찾지 못했습니다." };
  }

  refresh();
  return { ok: true };
}

export async function updateDemandStatus(formData: FormData): Promise<SaveResult> {
  const auth = await authorize(NEGOTIATOR);
  if (!auth.ok) return auth;

  const demandId = Number(formData.get("demandId"));
  const status = String(formData.get("status") ?? "");

  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  if (!(DEMAND_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "허용되지 않는 상태값입니다." };
  }

  const { data, error } = await auth.supabase
    .from("demands")
    .update({ status })
    .eq("id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `저장하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "저장할 요구안을 찾지 못했습니다." };
  }

  refresh();
  return { ok: true };
}

export async function updateBasicInfo(formData: FormData): Promise<SaveResult> {
  const auth = await authorize(NEGOTIATOR);
  if (!auth.ok) return auth;

  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const demandId = Number(formData.get("demandId"));
  const demandNo = text("demandNo");
  const category = text("category");
  const title = text("title");

  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  if (demandNo === "" || category === "" || title === "") {
    return { ok: false, error: "요구안번호, 분야, 제목은 꼭 입력하세요." };
  }
  if (!(DEMAND_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: "분야를 목록에서 고르세요." };
  }

  const { data, error } = await auth.supabase
    .from("demands")
    .update({
      demand_no: demandNo,
      category,
      title,
      union_request: text("unionRequest") || null,
    })
    .eq("id", demandId)
    .select("id");

  if (error) {
    // 23505: unique 제약 위반(요구안번호 중복)
    if (error.code === "23505") {
      return { ok: false, error: `이미 등록된 요구안번호입니다. (${demandNo})` };
    }
    return { ok: false, error: `저장하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "저장할 요구안을 찾지 못했습니다." };
  }

  refresh();
  return { ok: true };
}

// 사업장 회신 입력값 확인. 사업장담당은 입력값과 상관없이 자기 사업장으로 저장한다.
function readReviewFields(formData: FormData, profile: Profile) {
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const workplaceName =
    profile.role === "사업장담당" ? profile.workplaceName : text("workplaceName");
  const feasibility = text("feasibility");

  if (!workplaceName || !(WORKPLACES as readonly string[]).includes(workplaceName)) {
    return { ok: false as const, error: "사업장을 목록에서 고르세요." };
  }
  if (feasibility !== "" && !(FEASIBILITY_OPTIONS as readonly string[]).includes(feasibility)) {
    return { ok: false as const, error: "허용되지 않는 실행가능성 값입니다." };
  }

  return {
    ok: true as const,
    values: {
      workplace_name: workplaceName,
      current_status: text("currentStatus") || null,
      feasibility: feasibility || null,
      opinion: text("opinion") || null,
    },
  };
}

export async function addWorkplaceReview(formData: FormData): Promise<SaveResult> {
  const auth = await authorize();
  if (!auth.ok) return auth;

  const demandId = Number(formData.get("demandId"));
  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const fields = readReviewFields(formData, auth.profile);
  if (!fields.ok) return fields;

  const { error } = await auth.supabase
    .from("workplace_reviews")
    .insert({ demand_id: demandId, ...fields.values });

  if (error) {
    return { ok: false, error: `추가하지 못했습니다. (${error.message})` };
  }

  refresh();
  return { ok: true };
}

export async function updateWorkplaceReview(formData: FormData): Promise<SaveResult> {
  const auth = await authorize();
  if (!auth.ok) return auth;

  const demandId = Number(formData.get("demandId"));
  const reviewId = Number(formData.get("reviewId"));
  if (!Number.isInteger(demandId) || !Number.isInteger(reviewId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const fields = readReviewFields(formData, auth.profile);
  if (!fields.ok) return fields;

  // 사업장담당이 다른 사업장 회신을 고치려 하면 RLS 때문에 바뀌는 줄이 없다
  const { data, error } = await auth.supabase
    .from("workplace_reviews")
    .update(fields.values)
    .eq("id", reviewId)
    .eq("demand_id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `저장하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "수정할 회신을 찾지 못했거나 권한이 없습니다." };
  }

  refresh();
  return { ok: true };
}

export async function deleteWorkplaceReview(
  demandId: number,
  reviewId: number,
): Promise<SaveResult> {
  const auth = await authorize();
  if (!auth.ok) return auth;

  if (!Number.isInteger(demandId) || !Number.isInteger(reviewId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const { data, error } = await auth.supabase
    .from("workplace_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("demand_id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `삭제하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "삭제할 회신을 찾지 못했거나 권한이 없습니다." };
  }

  refresh();
  return { ok: true };
}

// 사업장 회신은 workplace_reviews 외래키의 on delete cascade로 함께 지워진다
export async function deleteDemand(demandId: number): Promise<SaveResult> {
  const auth = await authorize(NEGOTIATOR);
  if (!auth.ok) return auth;

  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const { data, error } = await auth.supabase
    .from("demands")
    .delete()
    .eq("id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `삭제하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "삭제할 요구안을 찾지 못했습니다." };
  }

  redirect("/demands");
}
