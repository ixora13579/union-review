"use client";

import { useActionState, useState } from "react";
import { DEMAND_STATUSES } from "@/lib/review-steps";
import { updateDemandStatus, type SaveResult } from "./actions";
import { Badge, STATUS_STYLES } from "./ui";

type Props = {
  demandId: number;
  status: string;
};

export function StatusField({ demandId, status }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <StatusForm demandId={demandId} status={status} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Badge value={status} styles={STATUS_STYLES} />
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
      >
        변경
      </button>
    </div>
  );
}

// 변경할 때마다 새로 그려지므로 이전 오류 메시지가 남지 않는다
function StatusForm({ demandId, status, onDone }: Props & { onDone: () => void }) {
  const [result, formAction, pending] = useActionState(
    async (_prev: SaveResult | null, formData: FormData) => {
      const saved = await updateDemandStatus(formData);
      if (saved.ok) onDone();
      return saved;
    },
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="demandId" value={demandId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={status}
          disabled={pending}
          className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:bg-gray-50"
        >
          {DEMAND_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
      </div>
      {result && !result.ok && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {result.error}
        </p>
      )}
    </form>
  );
}
