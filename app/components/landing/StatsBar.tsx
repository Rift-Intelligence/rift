"use client";

import { AnimatedCounter } from "./AnimatedCounter";

const STATS = [
  { label: "Hosts scanned", value: 12400, suffix: "+" },
  { label: "Vulnerabilities found", value: 847, suffix: "+" },
  { label: "Offensive tools", value: 40, suffix: "+" },
  { label: "Avg. recon", value: 3, suffix: " min", prefix: "<" },
] as const;

export function StatsBar({ className = "" }: { className?: string }) {
  return (
    <dl
      className={`grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 ${className}`}
    >
      {STATS.map((stat, i) => (
        <div key={stat.label}>
          <dt className="text-[12px] text-muted-foreground">{stat.label}</dt>
          <dd className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <AnimatedCounter
              value={stat.value}
              suffix={stat.suffix}
              prefix={"prefix" in stat ? stat.prefix : ""}
              duration={1600 + i * 120}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
