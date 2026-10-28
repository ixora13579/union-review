import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const ROLES = ["교섭담당", "사업장담당"] as const;
export type Role = (typeof ROLES)[number];

export type Profile = {
  id: string;
  name: string;
  role: Role;
  workplaceName: string | null;
};

// 현재 로그인한 사용자의 프로필. 로그인하지 않았거나 프로필이 없으면 null.
// 한 요청 안에서는 한 번만 조회한다.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, workplace_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    role: data.role,
    workplaceName: data.workplace_name,
  };
});

export function isNegotiator(profile: Profile | null) {
  return profile?.role === "교섭담당";
}

type Authorized = {
  ok: true;
  profile: Profile;
  supabase: Awaited<ReturnType<typeof createClient>>;
};
type Denied = { ok: false; error: string };

// 서버 함수에서 쓰는 권한 확인. 화면에서 버튼을 숨겨도 요청은 직접 보낼 수 있으므로 매번 확인한다.
export async function authorize(roles: readonly Role[] = ROLES): Promise<Authorized | Denied> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, error: "로그인이 필요하거나 권한이 설정되지 않은 계정입니다." };
  }
  if (!roles.includes(profile.role)) {
    return { ok: false, error: "이 작업을 할 권한이 없습니다." };
  }
  return { ok: true, profile, supabase: await createClient() };
}
