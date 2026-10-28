"use client";

import Form from "next/form";
import Link from "next/link";
import { DEMAND_CATEGORIES, DEMAND_STATUSES } from "@/lib/review-steps";

export type Filters = {
  category: string;
  status: string;
  q: string;
};

export function DemandFilters({ category, status, q }: Filters) {
  const inputClass = "rounded-lg border border-gray-300 px-3 py-2 text-sm";
  const filtered = category !== "" || status !== "" || q !== "";

  return (
    // 드롭다운은 바꾸는 즉시, 검색어는 Enter나 "검색" 버튼으로 적용한다
    <Form
      action="/demands"
      // 상태 카드를 눌러 주소가 바뀌면 입력칸 기본값도 새로 맞춘다
      key={`${category}|${status}|${q}`}
      className="flex flex-wrap items-center gap-2"
    >
      <select
        name="category"
        defaultValue={category}
        aria-label="분야"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={inputClass}
      >
        <option value="">분야 전체</option>
        {DEMAND_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={status}
        aria-label="상태"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={inputClass}
      >
        <option value="">상태 전체</option>
        {DEMAND_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="제목 검색"
        aria-label="제목 검색"
        className={`${inputClass} min-w-0 flex-1 sm:max-w-xs`}
      />
      <button
        type="submit"
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
      >
        검색
      </button>
      {filtered && (
        <Link href="/demands" className="px-2 text-sm text-gray-500 hover:underline">
          초기화
        </Link>
      )}
    </Form>
  );
}
