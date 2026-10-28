"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DEMAND_CATEGORIES, PREV_2024_RESULTS } from "@/lib/review-steps";

export type CreateResult = { error: string };

export async function createDemand(formData: FormData): Promise<CreateResult> {
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const demandNo = text("demandNo");
  const category = text("category");
  const title = text("title");
  const prev2024Result = text("prev2024Result");

  if (demandNo === "" || category === "" || title === "") {
    return { error: "요구안번호, 분야, 제목은 꼭 입력하세요." };
  }
  if (!(DEMAND_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "분야를 목록에서 고르세요." };
  }
  if (prev2024Result !== "" && !(PREV_2024_RESULTS as readonly string[]).includes(prev2024Result)) {
    return { error: "허용되지 않는 24년 결과 값입니다." };
  }

  const { data, error } = await supabase
    .from("demands")
    .insert({
      demand_no: demandNo,
      category,
      title,
      union_request: text("unionRequest") || null,
      prev_2024_request: text("prev2024Request") || null,
      prev_2024_result: prev2024Result || null,
    })
    .select("id")
    .single();

  if (error) {
    // 23505: unique 제약 위반(요구안번호 중복)
    if (error.code === "23505") {
      return { error: `이미 등록된 요구안번호입니다. (${demandNo})` };
    }
    return { error: `등록하지 못했습니다. (${error.message})` };
  }

  redirect(`/demands/${data.id}`);
}
