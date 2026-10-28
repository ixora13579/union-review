"use client";

import { useState, useTransition, type FormEvent } from "react";
import { FEASIBILITY_OPTIONS } from "@/lib/review-steps";
import { addWorkplaceReview, deleteWorkplaceReview } from "./actions";
import { Badge, FEASIBILITY_STYLES, Text, Verdict } from "./ui";

export type WorkplaceReview = {
  id: number;
  workplace_name: string;
  current_status: string | null;
  feasibility: string | null;
  opinion: string | null;
};

export function WorkplaceReviews({
  demandId,
  reviews,
}: {
  demandId: number;
  reviews: WorkplaceReview[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {reviews.length === 0 ? (
        <Verdict value={null} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="px-3 py-2 font-medium">사업장</th>
                <th className="px-3 py-2 font-medium">현장현황</th>
                <th className="px-3 py-2 font-medium">실행가능성</th>
                <th className="px-3 py-2 font-medium">의견</th>
                <th className="px-3 py-2">
                  <span className="sr-only">삭제</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-200 align-top">
                  <td className="whitespace-nowrap px-3 py-2">{review.workplace_name}</td>
                  <td className="px-3 py-2">
                    <Text value={review.current_status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {review.feasibility ? (
                      <Badge value={review.feasibility} styles={FEASIBILITY_STYLES} />
                    ) : (
                      <Verdict value={null} />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Text value={review.opinion} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DeleteButton demandId={demandId} review={review} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddReviewForm demandId={demandId} />
    </div>
  );
}

function DeleteButton({ demandId, review }: { demandId: number; review: WorkplaceReview }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(`"${review.workplace_name}" 회신을 삭제할까요?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteWorkplaceReview(demandId, review.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "삭제 중…" : "삭제"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-left text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}

function AddReviewForm({ demandId }: { demandId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // form action 대신 onSubmit을 써서, 실패했을 때 입력한 내용이 지워지지 않게 한다
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await addWorkplaceReview(formData);
      if (result.ok) {
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-gray-50 p-4">
      <h3 className="mb-3 font-medium">사업장 회신 추가</h3>
      <input type="hidden" name="demandId" value={demandId} />
      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">
            사업장명 <span className="text-red-600">*</span>
          </span>
          <input name="workplaceName" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">실행가능성</span>
          <select name="feasibility" defaultValue="" className={inputClass}>
            <option value="">미검토</option>
            {FEASIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-gray-500">현장현황</span>
          <textarea name="currentStatus" rows={2} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-gray-500">의견</span>
          <textarea name="opinion" rows={2} className={inputClass} />
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "추가 중…" : "추가"}
        </button>
      </div>
    </form>
  );
}
