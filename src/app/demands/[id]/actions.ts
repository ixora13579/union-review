"use server";

import { refresh } from "next/cache";
import { supabase } from "@/lib/supabase";
import { REVIEW_STEPS, type ReviewStepKey } from "@/lib/review-steps";

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
