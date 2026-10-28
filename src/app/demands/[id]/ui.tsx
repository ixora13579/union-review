import type { ReactNode } from "react";

// 서버·클라이언트 컴포넌트에서 함께 쓰는 표시용 컴포넌트

export const STATUS_STYLES: Record<string, string> = {
  검토중: "bg-gray-100 text-gray-700",
  수용: "bg-green-100 text-green-700",
  일부수용: "bg-blue-100 text-blue-700",
  수용곤란: "bg-red-100 text-red-700",
};

export const FEASIBILITY_STYLES: Record<string, string> = {
  가능: "bg-green-100 text-green-700",
  조건부: "bg-yellow-100 text-yellow-800",
  곤란: "bg-red-100 text-red-700",
};

export function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="whitespace-pre-wrap">{children}</dd>
    </div>
  );
}

export function Text({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="text-gray-400">-</span>;
}

export function Badge({ value, styles }: { value: string; styles?: Record<string, string> }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-sm font-medium ${styles?.[value] ?? "bg-blue-50 text-blue-700"}`}
    >
      {value}
    </span>
  );
}

// 판정이 비어 있으면 "미검토"로 회색 표시
export function Verdict({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-400">
        미검토
      </span>
    );
  }
  return <Badge value={value} />;
}
