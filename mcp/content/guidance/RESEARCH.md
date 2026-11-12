# Evidence method and limits

The guidance was extracted from review discussions, contributed code, work requirements and engineering documents. It combines recurring preferences into rules that can be applied without knowing the original systems.

## Interpretation

Direct review comments provide the strongest evidence of a preference. Contributed code corroborates behavior, while shared documents establish context. Repeated comments on the same change do not count as independent recurrence.

The extraction considered counterexamples. Preferences for cleanup coexist with focused scope. Helpful abstractions coexist with avoiding speculative complexity. Clear tests can use shared setup, mocks and several assertions when those choices support the scenario.

Some source discussions contained draft proposals. Their exact thresholds and implementation choices were not promoted into general requirements. Confidence in a preference is separate from the severity of a new finding.

An explicitly supplied values draft adds stated preferences about useful outcomes, shared capabilities, accountable ownership, bounded autonomy and evaluation of agent behavior. These strengthen the guidance without implying formally adopted organizational policy. The draft source and reconciliation are kept only in the research archive.

Support labels distinguish recurring observed preferences, context-dependent preferences and explicitly stated guidance. These labels describe the basis for a principle. They do not determine the severity of a finding or authorize an additional approval gate.

## Limits

Collection coverage and depth of inspection differ. The corpus was broadly collected, then screened by theme. Selected substantive comments, discussions and code changes were inspected in greater detail. Some source material was inaccessible or omitted by the source systems.

The resulting guidance is a qualitative review profile. It has not been evaluated against a held-out set of human reviews. Calibration cases are synthetic examples of intended judgment.

## Portable examples

Names, identifiers, source links and implementation-specific references were removed from the shared guidance. Examples are fictional. They establish no obligation to locate a function, inspect another repository, use a particular dependency or follow a historical design.

Original evidence remains in a separate hidden archive for provenance work explicitly requested by the user. Routine development and review use only the supplied task inputs and the shared guidance.
