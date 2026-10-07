import type { ReactNode } from "react";

export function MetricCard(props: { label: string; value: string | number; hint: string; icon: ReactNode; emphasis?: boolean }) {
  return <article className={props.emphasis ? "metric emphasis" : "metric"}><div className="metric-icon">{props.icon}</div><div><span>{props.label}</span><strong>{props.value}</strong><small>{props.hint}</small></div></article>;
}
