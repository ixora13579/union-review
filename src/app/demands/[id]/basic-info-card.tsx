"use client";

import { startTransition, useActionState, useState } from "react";
import { DEMAND_CATEGORIES } from "@/lib/review-steps";
import { updateBasicInfo, type SaveResult } from "./actions";
import { StatusField } from "./status-field";
import { Card, Field, Text } from "./ui";

type Props = {
  demandId: number;
  demandNo: string;
  category: string;
  title: string;
  unionRequest: string | null;
  status: string;
};

export function BasicInfoCard(props: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <Card
      title="기본정보"
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
      <div className="flex flex-col gap-3">
        {editing ? (
          <BasicInfoForm {...props} onDone={() => setEditing(false)} />
        ) : (
          <dl className="flex flex-col gap-3">
            <Field label="요구안번호">{props.demandNo}</Field>
            <Field label="분야">{props.category}</Field>
            <Field label="제목">{props.title}</Field>
            <Field label="노조 요구내용">
              <Text value={props.unionRequest} />
            </Field>
          </dl>
        )}
        {/* 상태는 기본정보 수정과 따로 변경한다 */}
        <dl>
          <Field label="상태">
            <StatusField demandId={props.demandId} status={props.status} />
          </Field>
        </dl>
      </div>
    </Card>
  );
}

// 수정할 때마다 새로 그려지므로 이전 오류 메시지가 남지 않는다
function BasicInfoForm({
  demandId,
  demandNo,
  category,
  title,
  unionRequest,
  onDone,
}: Props & { onDone: () => void }) {
  const [result, formAction, pending] = useActionState(
    async (_prev: SaveResult | null, formData: FormData) => {
      const saved = await updateBasicInfo(formData);
      if (saved.ok) onDone();
      return saved;
    },
    null,
  );

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50";

  // 목록에 없는 기존 분야 값이면 다시 고르게 한다
  const categoryValue = (DEMAND_CATEGORIES as readonly string[]).includes(category)
    ? category
    : "";

  return (
    // form action으로 넘기면 React가 제출 후 입력칸을 초기화하므로, 실패 시에도 입력값이 남도록 직접 호출한다
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="border-b border-gray-200 pb-4"
    >
      <input type="hidden" name="demandId" value={demandId} />
      <fieldset disabled={pending}>
        <dl className="flex flex-col gap-3">
          <Field label="요구안번호">
            <input name="demandNo" required defaultValue={demandNo} className={inputClass} />
          </Field>
          <Field label="분야">
            <select name="category" required defaultValue={categoryValue} className={inputClass}>
              <option value="" disabled>
                선택하세요
              </option>
              {DEMAND_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="제목">
            <input name="title" required defaultValue={title} className={inputClass} />
          </Field>
          <Field label="노조 요구내용">
            <textarea
              name="unionRequest"
              rows={4}
              defaultValue={unionRequest ?? ""}
              className={inputClass}
            />
          </Field>
        </dl>
      </fieldset>

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
