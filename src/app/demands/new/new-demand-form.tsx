"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { DEMAND_CATEGORIES, PREV_2024_RESULTS } from "@/lib/review-steps";
import { createDemand } from "./actions";

export function NewDemandForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // form action 대신 onSubmit을 써서, 실패했을 때 입력한 내용이 지워지지 않게 한다
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      // 성공하면 서버에서 상세 페이지로 이동시킨다
      const result = await createDemand(formData);
      setError(result.error);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";
  const required = <span className="text-red-600">*</span>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset disabled={pending} className="flex flex-col gap-6">
        <section className="rounded-lg border border-gray-200 p-5">
          <h2 className="mb-4 text-lg font-bold">기본정보</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">요구안번호 {required}</span>
              <input name="demandNo" required placeholder="예: 2026-11" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">분야 {required}</span>
              <select name="category" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  선택하세요
                </option>
                {DEMAND_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-gray-500">제목 {required}</span>
              <input name="title" required className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-gray-500">노조 요구내용</span>
              <textarea name="unionRequest" rows={4} className={inputClass} />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 p-5">
          <h2 className="mb-4 text-lg font-bold">1단계 24년도 요구안</h2>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500">24년 요구 내용</span>
              <textarea name="prev2024Request" rows={3} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:w-1/2">
              <span className="text-gray-500">24년 결과</span>
              <select name="prev2024Result" defaultValue="" className={inputClass}>
                <option value="">미검토</option>
                {PREV_2024_RESULTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link
          href="/demands"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
