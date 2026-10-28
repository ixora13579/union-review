"use client";

import { useState, useTransition } from "react";
import { deleteDemand } from "./actions";

type Props = {
  demandId: number;
  demandNo: string;
  title: string;
  reviewCount: number;
};

export function DeleteDemandButton({ demandId, demandNo, title, reviewCount }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const message =
      `[${demandNo}] ${title}\n\n이 요구안을 삭제할까요?` +
      (reviewCount > 0 ? `\n사업장 회신 ${reviewCount}건도 함께 삭제됩니다.` : "") +
      "\n삭제하면 되돌릴 수 없습니다.";
    if (!confirm(message)) return;

    setError(null);
    startTransition(async () => {
      // 성공하면 서버에서 목록으로 이동시킨다
      const result = await deleteDemand(demandId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2 border-t border-gray-200 pt-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "삭제 중…" : "요구안 삭제"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
