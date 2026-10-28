"use client";

import { useActionState, useState } from "react";
import { REVIEW_STEPS, type ReviewStepKey } from "@/lib/review-steps";
import { updateReviewStep, type SaveResult } from "./actions";
import { Card, Field, Text, Verdict } from "./ui";

type Props = {
  demandId: number;
  step: ReviewStepKey;
  verdict: string | null;
  opinion: string | null;
  amount?: number | null;
};

export function ReviewStepCard({ demandId, step, verdict, opinion, amount }: Props) {
  const [editing, setEditing] = useState(false);
  const { title, amountColumn } = REVIEW_STEPS[step];

  return (
    <Card
      title={title}
      action={
        !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            수정
          </button>
        )
      }
    >
      {editing ? (
        <StepForm
          demandId={demandId}
          step={step}
          verdict={verdict}
          opinion={opinion}
          amount={amount}
          onDone={() => setEditing(false)}
        />
      ) : (
        <dl className="flex flex-col gap-3">
          <Field label="판정">
            <Verdict value={verdict} />
          </Field>
          {amountColumn && (
            <Field label="추정액(연간)">
              {amount == null ? (
                <span className="text-gray-400">-</span>
              ) : (
                `${amount.toLocaleString("ko-KR")}원`
              )}
            </Field>
          )}
          <Field label="의견">
            <Text value={opinion} />
          </Field>
        </dl>
      )}
    </Card>
  );
}

// 수정할 때마다 새로 그려지므로 이전 오류 메시지가 남지 않는다
function StepForm({ demandId, step, verdict, opinion, amount, onDone }: Props & { onDone: () => void }) {
  const { options, amountColumn } = REVIEW_STEPS[step];
  const [result, formAction, pending] = useActionState(
    async (_prev: SaveResult | null, formData: FormData) => {
      const saved = await updateReviewStep(formData);
      if (saved.ok) onDone();
      return saved;
    },
    null,
  );

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";

  return (
    <form action={formAction}>
      <input type="hidden" name="demandId" value={demandId} />
      <input type="hidden" name="step" value={step} />
      <dl className="flex flex-col gap-3">
        <Field label="판정">
          <select name="verdict" defaultValue={verdict ?? ""} disabled={pending} className={inputClass}>
            <option value="">미검토</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        {amountColumn && (
          <Field label="추정액(원)">
            <input
              name="amount"
              inputMode="numeric"
              defaultValue={amount ?? ""}
              placeholder="예: 120000000"
              disabled={pending}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="의견">
          <textarea
            name="opinion"
            rows={3}
            defaultValue={opinion ?? ""}
            disabled={pending}
            className={inputClass}
          />
        </Field>
      </dl>

      {result && !result.ok && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {result.error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
