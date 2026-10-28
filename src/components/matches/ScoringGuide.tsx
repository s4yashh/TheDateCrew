import { ShieldCheck } from "lucide-react";
import { Modal } from "@/components/Modal";
import { ALGORITHM_VERSION, COMPONENT_LABELS, SCORE_WEIGHTS } from "@/matching/weights";

export function ScoringGuide({
  onClose,
  assessmentDemoMode,
  onAssessmentModeChange,
}: {
  onClose: () => void;
  assessmentDemoMode: boolean;
  onAssessmentModeChange: (enabled: boolean) => void;
}) {
  return (
    <Modal title="A transparent starting point" eyebrow="HOW MATCH SIGNALS WORK" onClose={onClose} size="lg">
      <div className="scoring-guide-body">
        <p className="scoring-guide-intro">
          The score is a decision-support signal for a matchmaker—not a prediction of relationship success.
          Explicit preferences, two-way fit, and human judgment matter more than any single number.
        </p>

        <div className="weight-list">
          {(Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>).map((key) => (
            <div className="weight-row" key={key}>
              <span>{COMPONENT_LABELS[key]}</span>
              <span className="weight-bar"><i style={{ width: `${SCORE_WEIGHTS[key] * 3}%` }} /></span>
              <strong>{SCORE_WEIGHTS[key]}%</strong>
            </div>
          ))}
        </div>

        <p className="scoring-weight-note">
          Weights renormalise over the components that have data. For a customer with no assessment signals,
          the remaining seven dimensions restore the brief’s 30 / 20 / 15 / 10 / 10 / 10 / 5 proportions.
        </p>

        <div className="scoring-method-grid">
          <div><strong>Two-way preference fit</strong><p>Forward fit checks what the customer is seeking. Reverse fit checks the candidate’s preferences too. Both are shown separately.</p></div>
          <div><strong>Unknown stays unknown</strong><p>Missing profile details are not treated as rejection. They lower confidence and appear as a conversation prompt.</p></div>
          <div><strong>Strict means strict</strong><p>Only explicitly marked strict preferences can exclude a recommendation. Flexible preferences affect ranking, not eligibility.</p></div>
          <div><strong>Human decision, always</strong><p>Shortlist, dismiss, or send only after reviewing profile facts. There are no guarantees or automated outreach.</p></div>
        </div>

        <label className="assessment-toggle">
          <span>
            <strong>Assessment demo signals · enabled by default</strong>
            <small>
              A real 10% component described in the assignment. It never rejects anyone, and any explicit customer
              preference suppresses the matching signal. Turn it off to score with mutual preferences alone.
            </small>
          </span>
          <input type="checkbox" checked={assessmentDemoMode} onChange={(event) => onAssessmentModeChange(event.target.checked)} />
          <span className="toggle-visual" />
        </label>

        {assessmentDemoMode && (
          <p className="heuristic-note">
            <ShieldCheck size={14} /> For male customers, small capped signals reflect age direction, relative height,
            and relative income when those details exist and no explicit preference overrides them. Children alignment
            is scored for every gender in the family dimension. For female customers, career, values, and relocation are
            already first-class weighted dimensions, so no duplicate bonus is added. These are assessment-specific
            assumptions—not universal preferences—and can be switched off.
          </p>
        )}

        <p className="fairness-footnote">
          Sensitive identity attributes such as religion and caste are optional, explicitly recorded, and never used by
          the matching score. Algorithm version: {ALGORITHM_VERSION}.
        </p>
      </div>
    </Modal>
  );
}
