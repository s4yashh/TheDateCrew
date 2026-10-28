"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { MatchResult } from "@/matching/scoring";

interface ExplanationResponse {
  explanation: string;
  source: "gemini" | "template";
  label: string;
  fallbackReason?: string;
  error?: string;
}

/**
 * Expanded explanation: grounded reasons, trade-offs, the full component
 * breakdown, and an optional AI narrative.
 *
 * The AI call is explicitly separate from scoring. It receives the already
 * computed result and is labelled, so a reviewer can always tell which text
 * came from the deterministic engine and which from the model.
 */
export function ScoreBreakdown({
  match,
  customerId,
  candidateId,
}: {
  match: MatchResult;
  customerId: string;
  candidateId: string;
}) {
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeComponents = match.components.filter((component) => component.applicable);
  const activeWeight = activeComponents.reduce((sum, component) => sum + component.weight, 0);

  async function explain() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, candidateId }),
      });
      const payload = await response.json() as ExplanationResponse;
      if (!response.ok) throw new Error(payload.error || "The explanation could not be generated.");
      setExplanation(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The explanation could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="match-explanation">
      <div className="explanation-column">
        <h4><Sparkles size={14} /> Supported reasons</h4>
        {match.positiveReasons.length
          ? <ul>{match.positiveReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          : <p>Not enough profile detail to identify a specific overlap yet. Treat this as a prompt for review.</p>}
      </div>

      <div className="explanation-column tradeoff-column">
        <h4><ShieldCheck size={14} /> Trade-offs & unknowns</h4>
        {match.tradeoffs.length
          ? <ul>{match.tradeoffs.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          : <p>No notable trade-offs surfaced from the details provided.</p>}
      </div>

      <div className="explanation-column score-breakdown-column">
        <h4>Score breakdown</h4>
        <div className="score-breakdown-list">
          {activeComponents.map((component) => (
            <div className="mini-score" key={component.key}>
              <span>{component.label}</span>
              <span className="mini-score-track"><i style={{ width: `${component.score}%` }} /></span>
              <strong>{component.score}</strong>
              <small>{Math.round((component.weight / activeWeight) * 100)}%</small>
            </div>
          ))}
        </div>
      </div>

      {match.assessmentSignals !== null && (
        <div className="explanation-column assessment-explanation">
          <h4><ShieldCheck size={14} /> Assessment demo signals</h4>
          <p>
            Enabled by default for this male-customer demo. These signals are capped at 10% of the score and are
            skipped whenever the customer has stated an explicit preference for that field.
          </p>
          {match.assessmentReasons.length > 0 && <ul>{match.assessmentReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        </div>
      )}

      <div className="explanation-meta">
        <span>Forward fit <strong>{match.forwardFit}</strong></span>
        <span>Reverse fit <strong>{match.reverseFit}</strong></span>
        {match.assessmentSignals !== null && <span>Assessment signals <strong>{match.assessmentSignals}</strong></span>}
        <span>Human review required</span>
      </div>

      <div className="ai-explanation-block">
        {!explanation && (
          <button className="button button-outline button-small" onClick={() => void explain()} disabled={loading}>
            {loading ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}
            {loading ? "Writing explanation…" : "Explain with AI"}
          </button>
        )}
        {error && <div className="inline-alert" role="alert"><TriangleAlert size={14} />{error}</div>}
        {explanation && (
          <div className="ai-explanation" data-source={explanation.source}>
            <span className="ai-explanation-label">
              <Sparkles size={12} /> {explanation.label}
              {explanation.fallbackReason ? <em> · {explanation.fallbackReason}</em> : null}
            </span>
            <p>{explanation.explanation}</p>
            <button className="text-button" onClick={() => void explain()} disabled={loading}>
              Regenerate <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
