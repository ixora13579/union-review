"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Role } from "@/lib/auth";
import { FEASIBILITY_OPTIONS, WORKPLACES } from "@/lib/review-steps";
import {
  addWorkplaceReview,
  deleteWorkplaceReview,
  updateWorkplaceReview,
  type SaveResult,
} from "./actions";
import { Badge, FEASIBILITY_STYLES, Text, Verdict } from "./ui";

export type WorkplaceReview = {
  id: number;
  workplace_name: string;
  current_status: string | null;
  feasibility: string | null;
  opinion: string | null;
};

type Viewer = {
  role: Role;
  // 사업장담당의 사업장. 회신의 사업장명과 글자가 같아야 자기 회신으로 본다.
  myWorkplace: string | null;
};

export function WorkplaceReviews({
  demandId,
  reviews,
  role,
  myWorkplace,
}: { demandId: number; reviews: WorkplaceReview[] } & Viewer) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const viewer = { role, myWorkplace };
  // 사업장담당에게는 자기 사업장 줄을 배경색으로 구분해 보여준다
  const isMine = (review: WorkplaceReview) =>
    role === "사업장담당" && review.workplace_name === myWorkplace;
  const canEdit = (review: WorkplaceReview) => role === "교섭담당" || isMine(review);

  return (
    <div className="flex flex-col gap-6">
      {reviews.length === 0 ? (
        <Verdict value={null} />
      ) : (
        <div className="overflow-x-auto">
          {role === "사업장담당" && (
            <p className="mb-2 text-sm text-gray-500">
              <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-blue-50 align-middle ring-1 ring-blue-200" />
              {myWorkplace} 회신만 수정·삭제할 수 있습니다.
            </p>
          )}
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="px-3 py-2 font-medium">사업장</th>
                <th className="px-3 py-2 font-medium">현장현황</th>
                <th className="px-3 py-2 font-medium">실행가능성</th>
                <th className="px-3 py-2 font-medium">의견</th>
                <th className="px-3 py-2">
                  <span className="sr-only">수정·삭제</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) =>
                editingId === review.id ? (
                  <tr key={review.id} className="border-b border-gray-200">
                    <td colSpan={5} className="py-3">
                      <ReviewForm
                        demandId={demandId}
                        viewer={viewer}
                        review={review}
                        onDone={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={review.id}
                    className={`border-b border-gray-200 align-top ${isMine(review) ? "bg-blue-50" : ""}`}
                  >
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
                      {canEdit(review) && (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(review.id)}
                            className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                          >
                            수정
                          </button>
                          <DeleteButton demandId={demandId} review={review} />
                        </div>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      <ReviewForm demandId={demandId} viewer={viewer} />
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
    <div>
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
    </div>
  );
}

// review 가 있으면 수정 폼, 없으면 추가 폼
function ReviewForm({
  demandId,
  viewer,
  review,
  onDone,
}: {
  demandId: number;
  viewer: Viewer;
  review?: WorkplaceReview;
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = review !== undefined;

  // form action 대신 onSubmit을 써서, 실패했을 때 입력한 내용이 지워지지 않게 한다
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result: SaveResult = editing
        ? await updateWorkplaceReview(formData)
        : await addWorkplaceReview(formData);
      if (!result.ok) {
        setError(result.error);
      } else if (editing) {
        onDone?.();
      } else {
        form.reset();
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";

  // 목록에 없는 기존 사업장명이면 다시 고르게 한다
  const workplaceValue =
    review && (WORKPLACES as readonly string[]).includes(review.workplace_name)
      ? review.workplace_name
      : "";

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-gray-50 p-4">
      <h3 className="mb-3 font-medium">{editing ? "사업장 회신 수정" : "사업장 회신 추가"}</h3>
      <input type="hidden" name="demandId" value={demandId} />
      {review && <input type="hidden" name="reviewId" value={review.id} />}
      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">
            사업장 <span className="text-red-600">*</span>
          </span>
          {viewer.role === "교섭담당" ? (
            <select name="workplaceName" required defaultValue={workplaceValue} className={inputClass}>
              <option value="" disabled>
                선택하세요
              </option>
              {WORKPLACES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            // 사업장담당은 서버에서 자기 사업장으로 저장한다
            <p className="py-2">
              {viewer.myWorkplace}
              {!editing && <span className="text-gray-500">로 등록됩니다</span>}
            </p>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">실행가능성</span>
          <select name="feasibility" defaultValue={review?.feasibility ?? ""} className={inputClass}>
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
          <textarea
            name="currentStatus"
            rows={2}
            defaultValue={review?.current_status ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-gray-500">의견</span>
          <textarea
            name="opinion"
            rows={2}
            defaultValue={review?.opinion ?? ""}
            className={inputClass}
          />
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {editing && (
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : editing ? "저장" : "추가"}
        </button>
      </div>
    </form>
  );
}
