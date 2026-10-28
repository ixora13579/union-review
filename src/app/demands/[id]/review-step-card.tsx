"use client";

import { startTransition, useActionState, useState } from "react";
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
  const { title, amountColumn, verdictLabel = "판정", opinionLabel = "의견", opinionFirst } =
    REVIEW_STEPS[step];

  const verdictField = (
    <Field key="verdict" label={verdictLabel}>
      <Verdict value={verdict} />
    </Field>
  );
  const amountField = amountColumn && (
    <Field key="amount" label="추정액(연간)">
      {amount == null ? (
        <span className="text-gray-400">-</span>
      ) : (
        `${amount.toLocaleString("ko-KR")}원`
      )}
    </Field>
  );
  const opinionField = (
    <Field key="opinion" label={opinionLabel}>
      <Text value={opinion} />
    </Field>
  );

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
          {opinionFirst
            ? [opinionField, verdictField, amountField]
            : [verdictField, amountField, opinionField]}
        </dl>
      )}
    </Card>
  );
}

// 수정할 때마다 새로 그려지므로 이전 오류 메시지가 남지 않는다
function StepForm({ demandId, step, verdict, opinion, amount, onDone }: Props & { onDone: () => void }) {
  const {
    options,
    amountColumn,
    verdictLabel = "판정",
    opinionLabel = "의견",
    opinionFirst,
  } = REVIEW_STEPS[step];
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

  const verdictField = (
    <Field key="verdict" label={verdictLabel}>
      <select name="verdict" defaultValue={verdict ?? ""} disabled={pending} className={inputClass}>
        <option value="">미검토</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
  const amountField = amountColumn && (
    <Field key="amount" label="추정액(원)">
      <input
        name="amount"
        inputMode="numeric"
        defaultValue={amount ?? ""}
        placeholder="예: 120000000"
        disabled={pending}
        className={inputClass}
      />
    </Field>
  );
  const opinionField = (
    <Field key="opinion" label={opinionLabel}>
      <textarea
        name="opinion"
        rows={3}
        defaultValue={opinion ?? ""}
        disabled={pending}
        className={inputClass}
      />
    </Field>
  );

  return (
    // form action으로 넘기면 React가 제출 후 입력칸을 초기화하므로, 실패 시에도 입력값이 남도록 직접 호출한다
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <input type="hidden" name="demandId" value={demandId} />
      <input type="hidden" name="step" value={step} />
      <dl className="flex flex-col gap-3">
        {opinionFirst
          ? [opinionField, verdictField, amountField]
          : [verdictField, amountField, opinionField]}
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
