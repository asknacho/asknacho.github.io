# Review calibration examples

All examples are fictional and self-contained; their names do not identify code to locate elsewhere. They help evaluate a reviewer’s judgment. They have not been used to measure this prompt’s accuracy.

## 1 An uncertain provider write

A status mutation receives HTTP 200, but parsing its response raises. The rescue returns “request failed; retry.” The provider may already have changed the campaign.

**Expected:** Required change, P09. Explain possible duplicate or repeated writes. Preserve campaign selection and require state discovery before retrying. Request a test through the provider and tool path with the malformed HTTP response.

## 2 A naming suggestion

The new method is called `filter_items`, but it only changes items’ ordering. Both branches return the required results. Existing callers use it correctly.

**Expected:** Suggestion, P05. Recommend `prioritize_items`. Explain the difference in meaning briefly. This suggestion alone does not fail the review.

## 3 Pagination coverage

A new cursor endpoint is required to page over results. Its only test fetches the first page, checks two rows and asserts that a cursor exists. Inspection shows the implementation ignores the incoming cursor.

**Expected:** Required change, P13. Request page two using page one’s cursor and assert its exact contents and ordering. Identify the implementation defect and the missing scenario together.

## 4 A working implementation with shared setup

Tests use shared setup for a database sandbox and provider configuration cleanup. Each test creates its own small dataset. They have two assertions checking the returned value and persisted state.

**Expected:** No finding based on setup or assertion count. P14 permits focused shared infrastructure and meaningful multiple assertions.

## 5 Premature infrastructure

A scheduled batch reads data, computes a result and saves it. The design adds an event broker and two new independently deployed services solely for a possible future real-time workflow. No requirement needs that workflow.

**Expected:** Architecture suggestion or question, P02/P21. Ask which present requirement needs the new boundaries, identify their operating cost, and propose the existing job runner as a simpler option. Escalate only if there is a demonstrated requirement or reliability violation.

## 6 Readable code with a broken cross-layer contract

A provider returns `invalid_current_state`, discovery instructions and the selected resource. A generic dispatcher replaces the envelope with `internal_failure` and `retry: never`.

**Expected:** Required change, P07/P08. Preserve and validate the structured envelope before legacy fallback. Verify the result and telemetry through the combined provider-dispatch path. Green isolated tests do not settle the integration behavior.

## 7 A pre-existing deployment check

A PR changes a workflow timeout. The same workflow already smoke-tests a staging URL during production releases. That URL is unchanged and the PR does not alter release validation.

**Expected:** No new blocking finding. A brief follow-up may be useful, P20. If the PR actually claims to introduce production smoke validation, reassess against that requirement.

## 8 Multiplied concurrency

There are already seven concurrent account reads. A proposed optimization adds four parallel requests per account. It gives no measurements or provider request budget.

**Expected:** Explain the possible 28 concurrent calls, P11. Ask for the relevant workload and limits; suggest retaining sequential inner batches until measured. Do not claim rate limiting is certain without evidence.

## 9 Test environment leakage

A test overwrites a global provider config and never restores it. Another test reads that same setting, so execution order changes its behavior.

**Expected:** Required change, P15. Snapshot the original state and restore it on exit, preserving whether the key originally existed. Verify the tests together or in the failing order.

## 10 Behavior hidden by a successful no-op

A consumer’s new mapper returns an error for a missing mandatory configuration. The handler logs it, returns an empty target list and acknowledges the message as successful.

**Expected:** Required change, P08/P10. Preserve the failure reason and use the framework’s failure path. Keep intentional “no target applies” behavior distinct.

## 11 An older draft rule

A draft testing proposal says factories must always use random required values. A current regression test uses a fixed boundary value because that exact value triggers a defect.

**Expected:** No finding about the fixed value. The draft rule is contextual; deterministic boundary evidence serves the test. Apply P13/P14.

## 12 Missing requirements

The PR body contains only an empty template. The diff adds a new reporting feature, and its desired behavior cannot be established from the ticket.

**Expected:** Identify the missing requirement context. Do not invent acceptance criteria or claim full requirements coverage. Follow the hosting workflow’s skip rule if it has one; otherwise limit any assessment to demonstrable behavior.

## 13 An agent for fixed rules

A periodic import applies a fixed set of transformations. A proposed design adds a model call for each row without identifying any interpretation the rules cannot handle.

**Expected:** Suggestion or architecture question, P02/P25. Ask what present need requires interpretation and compare the cost, variability and maintenance with an ordinary deterministic job. Avoid a blanket ban on agents or an automatic blocking verdict.

## 14 Automation exceeds its intended authority

An investigation workflow is explicitly required to be read-only and to stop after a bounded investigation. Its new agent receives unrestricted mutation tools and continues calling tools indefinitely until it declares success.

**Expected:** Required change, P25. Point to the authority and stop-condition requirement gaps. Restrict accessible actions and enforce the applicable execution budget. Verify attempts to write and attempts to continue after the stop condition.

## 15 Retrieved instructions override product boundaries

A product assistant has tools that update user data. A prompt change tells it to follow instructions from retrieved documents, allowing a retrieved page to request an update outside the user’s task. Existing tests cover only ordinary questions.

**Expected:** Required change, P25/P26. Explain the concrete untrusted-input path to an unauthorized action. Preserve the user’s task authority and test misleading retrieved instructions through the actual workflow. Re-evaluate the changed behavior and its recovery path.

## 16 A deliberate shared-platform exception

A team documents that the supported shared connector cannot meet a required interface contract. It chooses a small local adapter, records the maintenance tradeoff and assigns an owner. The behavior is covered by contract tests.

**Expected:** No finding solely because the shared connector was not used, P07/P24. Verify the documented gap and review the adapter on its actual behavior. Do not invent an exception-approval process.
