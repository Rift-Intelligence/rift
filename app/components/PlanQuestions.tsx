"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { submitChatMessage } from "@/lib/utils/submit-message";

/**
 * Claude-style clarifying questions rendered as clickable option cards. The
 * Build agent (Plan mode) emits a fenced ```rift-questions block with this
 * shape; MessagePartHandler detects it and renders this component. Picking
 * options and hitting Continue sends the choices back as a normal user message
 * so the agent proceeds — no special tool/pause machinery needed.
 */
export interface PlanQuestionOption {
  label: string;
  detail?: string;
}
export interface PlanQuestion {
  id?: string;
  question: string;
  multi?: boolean;
  options: PlanQuestionOption[];
}
export interface PlanQuestionsData {
  questions: PlanQuestion[];
}

/** Parse a rift-questions JSON payload; returns null when malformed/empty. */
export function parsePlanQuestions(json: string): PlanQuestionsData | null {
  try {
    const data = JSON.parse(json) as PlanQuestionsData;
    if (
      !data ||
      !Array.isArray(data.questions) ||
      data.questions.length === 0
    ) {
      return null;
    }
    const questions = data.questions.filter(
      (q) => q && typeof q.question === "string" && Array.isArray(q.options),
    );
    return questions.length ? { questions } : null;
  } catch {
    return null;
  }
}

export function PlanQuestions({ data }: { data: PlanQuestionsData }) {
  // selections[qIndex] = set of chosen option labels
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const toggle = (qi: number, label: string, multi: boolean) => {
    if (submitted) return;
    setSelections((prev) => {
      const cur = prev[qi] ?? [];
      if (multi) {
        return {
          ...prev,
          [qi]: cur.includes(label)
            ? cur.filter((l) => l !== label)
            : [...cur, label],
        };
      }
      return { ...prev, [qi]: cur.includes(label) ? [] : [label] };
    });
  };

  const answeredCount = data.questions.filter(
    (_, qi) => (selections[qi]?.length ?? 0) > 0,
  ).length;
  const canSubmit = answeredCount > 0 && !submitted;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const lines = data.questions
      .map((q, qi) => {
        const chosen = selections[qi] ?? [];
        if (chosen.length === 0) return null;
        return `- ${q.question} → ${chosen.join(", ")}`;
      })
      .filter(Boolean);
    if (lines.length === 0) return;
    setSubmitted(true);
    submitChatMessage(`Here are my choices:\n${lines.join("\n")}`);
  };

  return (
    <div className="my-2 flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-4">
      {data.questions.map((q, qi) => {
        const chosen = selections[qi] ?? [];
        return (
          <div key={q.id ?? qi} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-[13.5px] font-medium text-foreground">
                {q.question}
              </p>
              {q.multi && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  choose any
                </span>
              )}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {q.options.map((opt) => {
                const active = chosen.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={submitted}
                    onClick={() => toggle(qi, opt.label, !!q.multi)}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-70 ${
                      active
                        ? "border-primary bg-primary/[0.07]"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {active && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium text-foreground">
                        {opt.label}
                      </span>
                      {opt.detail && (
                        <span className="block text-[11.5px] leading-snug text-muted-foreground">
                          {opt.detail}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-muted-foreground">
          {submitted
            ? "Choices sent."
            : `${answeredCount}/${data.questions.length} answered`}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitted ? "Sent" : "Continue"}
          {!submitted && <ArrowRight className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}
