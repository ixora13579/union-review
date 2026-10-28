import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 p-6">
        <h1 className="text-xl font-bold">노조 요구안 검토 관리</h1>
        <p className="mb-6 mt-1 text-sm text-gray-500">로그인이 필요합니다.</p>
        <Suspense>
          {searchParams.then(({ next }) => (
            <LoginForm next={typeof next === "string" ? next : "/"} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}
