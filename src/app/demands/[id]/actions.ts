"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DEMAND_CATEGORIES,
  DEMAND_STATUSES,
  FEASIBILITY_OPTIONS,
  REVIEW_STEPS,
  type ReviewStepKey,
} from "@/lib/review-steps";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function updateReviewStep(formData: FormData): Promise<SaveResult> {
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

  const { data, error } = await supabase
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
  const demandId = Number(formData.get("demandId"));
  const status = String(formData.get("status") ?? "");

  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  if (!(DEMAND_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "허용되지 않는 상태값입니다." };
  }

  const { data, error } = await supabase
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

export async function addWorkplaceReview(formData: FormData): Promise<SaveResult> {
  const demandId = Number(formData.get("demandId"));
  const workplaceName = String(formData.get("workplaceName") ?? "").trim();
  const currentStatus = String(formData.get("currentStatus") ?? "").trim();
  const feasibility = String(formData.get("feasibility") ?? "");
  const opinion = String(formData.get("opinion") ?? "").trim();

  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  if (workplaceName === "") {
    return { ok: false, error: "사업장명을 입력하세요." };
  }
  if (feasibility !== "" && !(FEASIBILITY_OPTIONS as readonly string[]).includes(feasibility)) {
    return { ok: false, error: "허용되지 않는 실행가능성 값입니다." };
  }

  const { error } = await supabase.from("workplace_reviews").insert({
    demand_id: demandId,
    workplace_name: workplaceName,
    current_status: currentStatus || null,
    feasibility: feasibility || null,
    opinion: opinion || null,
  });

  if (error) {
    return { ok: false, error: `추가하지 못했습니다. (${error.message})` };
  }

  refresh();
  return { ok: true };
}

export async function deleteWorkplaceReview(
  demandId: number,
  reviewId: number,
): Promise<SaveResult> {
  if (!Number.isInteger(demandId) || !Number.isInteger(reviewId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const { data, error } = await supabase
    .from("workplace_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("demand_id", demandId)
    .select("id");

  if (error) {
    return { ok: false, error: `삭제하지 못했습니다. (${error.message})` };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "삭제할 회신을 찾지 못했습니다." };
  }

  refresh();
  return { ok: true };
}

export async function updateBasicInfo(formData: FormData): Promise<SaveResult> {
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

  const { data, error } = await supabase
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

// 사업장 회신은 workplace_reviews 외래키의 on delete cascade로 함께 지워진다
export async function deleteDemand(demandId: number): Promise<SaveResult> {
  if (!Number.isInteger(demandId)) {
    return { ok: false, error: "잘못된 요청입니다." };
  }

  const { data, error } = await supabase
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
