"use client";

import { useState, useTransition, type FormEvent } from "react";
import { signIn } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // form action 대신 onSubmit을 써서, 실패했을 때 입력한 이메일이 지워지지 않게 한다
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      // 성공하면 서버에서 원래 가려던 페이지로 이동시킨다
      const result = await signIn(formData);
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <fieldset disabled={pending} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">이메일</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">비밀번호</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
