import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

// 상단 바: 로그인한 사람 이름·사업장(역할)과 로그아웃 버튼. 로그인 전에는 표시하지 않는다.
export async function UserBar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const profile = await getProfile();
  const who = !profile
    ? (data.claims.email ?? "권한 미설정 계정")
    : profile.role === "사업장담당"
      ? `${profile.name} · ${profile.workplaceName}(사업장담당)`
      : `${profile.name} · 교섭담당`;

  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-8 py-3 text-sm">
        <Link href="/" className="font-bold">
          노조 요구안 검토 관리
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-gray-600">{who}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
