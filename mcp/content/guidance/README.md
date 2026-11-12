# Development and review guidance

Start with [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md), the central human-readable guide. It explains how to develop and review changes through small, generic examples.

All shared documents are self-contained. Their examples identify no historical code or external project. Apply them only to the code, design and requirements supplied for the current task.

## Files

| File | Purpose |
| --- | --- |
| [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) | Central guide for people and agents. |
| [REVIEW_AGENT.md](REVIEW_AGENT.md) | Standalone instructions for a first-pass reviewer. |
| [PRINCIPLES.md](PRINCIPLES.md) | The 26 individual principles, examples and application limits. |
| [principles.json](principles.json) | Structured version of the same principles. |
| [CALIBRATION.md](CALIBRATION.md) | Synthetic examples of review judgment. |
| [RESEARCH.md](RESEARCH.md) | Generic explanation of the evidence method and its limits. |

The P01–P26 labels are local principle references. They identify no external work item or code location.

## Use with an agent

Load `REVIEW_AGENT.md`, then supply the actual review inputs:

```text
Review the supplied change using this guidance.
Review scope: <current code or design>
Requirements: <expected behavior and constraints>
Revision: <version being reviewed>
Return required changes, suggestions, questions and validation limits.
```

Add `DEVELOPMENT_GUIDELINES.md` when the agent benefits from the fuller explanation. The review prompt also works alone. No source archive or external repository is needed to understand these preferences.

## Maintain the shared reference

Edit `principles.json`, then run:

```sh
python3 scripts/build_principles.py
```

This regenerates `PRINCIPLES.md`. Keep the central guide, review prompt and calibration examples aligned with any substantive changes.

Original research material is retained separately in a hidden archive excluded from version control and from the review scope. It is for explicitly requested provenance work. The shared guidance contains no links into it.
