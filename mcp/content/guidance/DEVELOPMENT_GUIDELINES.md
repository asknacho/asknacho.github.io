# Development and review guidelines

Build the smallest complete solution to the current requirement. Make its behavior easy to follow, test and operate. Keep failures visible and recoverable. During review, explain concrete consequences and distinguish necessary fixes from optional improvements.

This is the central guide for people and agents. It applies across languages, frameworks and application types. All examples are fictional and self-contained. They provide no reason to search for code outside the supplied review inputs.

## Values behind the guidelines

- **Shared success:** consider the people and teams who depend on the system. Make knowledge, interfaces and useful capabilities maintainable by others.
- **Useful outcomes:** judge work by the value it delivers and what it helps us learn. Generated code, activity and change counts are insufficient measures of success.
- **Sustainable speed:** include review, integration, testing, release and recovery when assessing delivery speed. Keep parallel work within the capacity to validate and support it.
- **Reliability and trust:** protect data integrity, respect applicable privacy and consent requirements, and make limitations visible when they affect user decisions.

## 1 Start with the required outcome

Establish what should happen, for whom, and under which constraints. Identify the behavior that must stay compatible and the consequences of failure.

For example, a periodic import might need to read records, validate them and save accepted results. Start with that workflow. Add streaming, a separate service or a coordination layer when a concrete requirement justifies its cost.

Validate important assumptions early. Before expanding the import, check that users need the additional data. Reassess the direction as feedback arrives and stop work that no longer provides enough value. Limit parallel work to what can be integrated and reviewed responsibly.

Keep the change coherent. Related edits can belong together when they deliver one complete behavior. Unrelated cleanup and risky refactors usually deserve separate changes. For critical existing paths, establish meaningful coverage before changing their structure.

Size alone does not determine whether a change should be split. Useful boundaries allow someone to understand, verify and release each step. When changes depend on one another, state their order.

Related principles: P01, P02, P23.

## 2 Make responsibilities and data flow explicit

Put a decision with the component that owns its meaning. Separate downloading, parsing, business decisions, persistence and presentation when the separation makes ownership clearer.

Extend the import example incrementally:

1. A reader retrieves the input.
2. A parser turns it into records.
3. Validation decides which records are acceptable.
4. Persistence saves accepted records.
5. Presentation reports the outcome.

Each step exposes the inputs and outputs that matter. A parser receives input explicitly. A reusable operation receives the settings or dependency it needs. Tests can then supply controlled inputs without changing hidden global state.

An abstraction should make a real responsibility or shared contract easier to understand. Several concrete use cases can reveal a useful common interface. Extra forwarding functions and speculative options can make the path harder to follow.

Consider effects on other teams and make dependencies visible. Reuse supported shared capabilities where they meet the requirements. Record the reason and tradeoff for a deliberate exception. Keep setup, interfaces and documentation usable by someone outside the original implementation conversation.

Related principles: P03, P04, P07, P24.

## 3 Write code that explains its behavior

Use names that describe the actual operation. Keep domain terms consistent across functions, data structures, tests and interfaces. Give important thresholds and business values meaningful names.

For example, an operation that changes ordering should have a name that suggests prioritization. A name that suggests filtering would imply that some records disappear. This matters most when ambiguity can lead a caller to use the operation incorrectly.

Use guard clauses or pattern matching when they reduce nesting and the context a reader must remember. Keep the meaningful path visible. Remove redundant checks, unnecessary transformations and helpers that merely pass values onward.

Readability depends on context. More functions, fewer lines and shorter names do not establish simplicity by themselves. Naming and local simplification are usually suggestions unless they cause a concrete behavioral problem.

Related principles: P05, P06.

## 4 Preserve meaning across boundaries

An interface must preserve the information its caller needs. Check types, units, nulls, timestamps, ordering and partial data. Reuse the current system’s canonical mappings and contracts where they fit.

Return to the import example. A missing measurement is different from a measured zero. The time a record originated is different from the time it arrived. Combining those meanings can produce correct-looking output that answers the wrong question.

Adapters should preserve useful semantics. If an error carries a cause, affected record and recovery instruction, a wrapper should not erase them. Keep external-system interpretation in the integration layer so business code can use a stable contract.

For public or agent-facing interfaces, descriptions and annotations are part of that contract. A validation operation must describe what it verifies. An operation that writes data must disclose that behavior. Verify dependency-specific details against the version actually used in the supplied system.

Related principles: P07, P17, P22.

## 5 Design failure and recovery together

Distinguish an intentional no-op from a failure. Separate invalid input, permanent failures, temporary failures and uncertain outcomes. Preserve enough context to explain what happened and what can happen next.

For the import, an unsupported record type may be intentionally ignored. Missing required configuration means the operation could not run correctly. These outcomes need different handling. Logging an error and acknowledging successful processing can silently lose work.

For a partially successful batch, keep successful results and identify failed items clearly. Avoid discarding valid work because another item failed, unless the requirement makes the whole batch atomic.

A failed response does not always establish a failed external write. An update can succeed in an external system and then lose its response. Before repeating it, discover the current resource state or use the system’s supported idempotency mechanism.

Mark work complete after the required operation succeeds. Use transactions for database changes that must succeed together, such as a persisted change and its required background work. Check interruption, duplicate delivery, replay and concurrent updates. A preliminary status check alone does not establish exclusive ownership.

Related principles: P08, P09, P10.

## 6 Plan for realistic volume and operation

Use the actual workload to assess query cost, memory, batch sizes, paging, timeouts and concurrency. Make termination conditions explicit. Keep long-running work away from interactive paths when it would block users.

An import that works for a few hundred records may behave differently with millions. Fetching bounded batches can control memory. If three concurrent tasks each launch four requests, the external system may receive twelve concurrent requests. Account for this multiplication before increasing either limit.

Measure the bottleneck before adding an optimization. Explain which workload improves and what extra cost or coordination it introduces.

Check the running path as well as the implementation. A new operation must be registered, configured and reachable through its intended interface. Startup requirements should match the components being run. An unrelated component failure should respect the intended isolation boundaries.

Make production behavior diagnosable. Record useful identifiers, causes, state transitions and durations. Verify that failures actually reach monitoring with usable context. Alert on meaningful operational or business impact and control repetitive noise. Keep credentials and personal data out of logs.

Optional analytics should not break a business operation. Mandatory audit behavior follows the applicable requirements.

Related principles: P11, P12, P16.

## 7 Test scenarios that could reveal a real defect

Choose the least expensive test boundary that can catch the failure. Use focused unit tests for isolated decisions and integration tests where behavior depends on interactions. End-to-end machinery should demonstrate useful coverage beyond cheaper tests.

Build coverage incrementally for the import:

1. A valid record is accepted and saved correctly.
2. Invalid input produces the intended failure without saving incorrect data.
3. A mixed batch preserves accepted records and reports rejected ones.
4. A repeated delivery follows the required duplicate-handling behavior.
5. A paged read requests the next page and verifies its contents and ordering.
6. An interrupted external write produces a recoverable uncertain outcome.

Assert meaningful outcomes. A cursor’s existence alone does not prove pagination. A helper-level classification test does not prove the full interface preserves the result. Exercise the boundary where the defect can occur.

External fixtures should reflect real response contracts. Code and tests can repeat the same mistaken assumption, so agreement between them is insufficient evidence of compatibility.

Use independent checks of the intended requirements and domain rules where a shared assumption could hide a defect. This matters equally for code written by a person and code produced with an agent.

Keep scenario data near the test. Create only the fields and persisted records that matter. Avoid broad conditional setup that makes the scenario difficult to reconstruct. Share infrastructure and cleanup when that makes tests clearer.

Isolate test data from development and live data. Restore shared configuration, including whether a key originally existed. Keep external writes blocked unless a deliberately controlled test environment is part of the requirement.

Related principles: P13, P14, P15.

## 8 Finish the change within its scope

Remove obsolete implementations, unused configuration and stale fixtures when they can be removed safely within the change. Keep risky or unrelated cleanup separate.

Maintain tests, documentation, prompts, repository instructions and automation workflows as the system evolves. Generated material needs the same justification for keeping it as any other maintained artifact.

Explain what changed, why it matters and any consequential tradeoff. Describe workflows in execution order. Include the evidence a reviewer needs to assess the change. Add background when it helps explain a decision.

A complete change includes appropriate verification and a clear account of what remains uncertain. Passing automated checks supports the assessment; it does not prove every affected path was exercised.

Implementation completion, deployment and release to users are separate milestones. Verify the result at the relevant stage. Keep an accountable engineer or team for the behavior, its operating cost and its recovery, including when work was delegated to an agent.

Related principles: P16, P18, P19, P24.

## 9 Scale architecture work to the consequences

Review a design through its required outcome, ownership, failure behavior, realistic scale and operating cost. Prefer a design whose main path and failure points an owner can explain simply.

Establish which state is authoritative and where each business decision belongs. Check whether deployment boundaries support independent responsibilities or create unnecessary coordination. Identify what guarantees the chosen mechanisms actually provide.

Plan rollout, data migration, monitoring, recovery and rollback. A small reversible release can use a simple plan and prompt feedback. A change affecting sensitive or difficult-to-repair data needs more design and validation before release.

When proposing an extra service, framework or coordination mechanism, explain the present requirement it solves and its cost. Compare it with the simplest viable alternative. Avoid prescribing a technology or architecture style without that connection.

Include review, rework, latency, operation and future maintenance in that cost. Fast generation can still create a slow or expensive system to validate and support.

Related principles: P02, P21, P24.

## 10 Make reviews concrete and proportionate

Review the supplied code or design against its explicit requirements. Trace enough context to understand changed behavior. Avoid repeating existing findings or expanding into unrelated historical problems.

A useful finding identifies:

1. The input, state or execution order that triggers the issue.
2. What the implementation does.
3. The resulting consequence.
4. The relevant changed location or design decision.
5. A practical fix and how to verify it.

Classify by consequence:

| Classification | When to use it |
| --- | --- |
| Required change | A demonstrated requirement gap, incorrect result, data loss, unsafe operation, security exposure or material reliability or performance failure. |
| Suggestion | A useful improvement to naming, readability, cleanup or efficiency that does not materially affect required behavior. |
| Question | A consequential ambiguity that available evidence cannot resolve. |

Suggestions alone do not fail a review. Severity and confidence are separate judgments. When evidence is incomplete, explain what is unknown and what would resolve it.

Use simple technical language and small examples. State the concern and its consequence early. Separate source inspection, executed tests and reported automated results. If there are no actionable findings, say so directly.

Related principle: P20.

## 11 Bound automation and evaluate agent behavior

Use deterministic automation when the rules are known. Use an agent when interpretation or exploration adds enough value to justify its uncertainty and operating cost.

For the import example, fixed parsing and validation can remain an ordinary job. An agent may help investigate unfamiliar failures. Give that investigation a clear goal, suitable tools and data, limited access, and explicit time and cost budgets. Define what ends the work and which consequential actions require human review under the applicable authority.

The level of autonomy should match the impact and reversibility of its actions. Preserve useful evidence of important decisions. Operators need a practical way to stop or recover from unacceptable behavior. These controls apply to the workflow being built; ordinary authorized development work does not need additional approval prompts.

When an agent is part of the product, evaluate behavior through representative tasks and failure cases. Reassess after changes to models, prompts, tools or data. Extend the example incrementally:

1. The agent handles an ordinary investigation within its scope.
2. Missing information produces a clear limitation or focused request.
3. Misleading retrieved text does not change the agent’s authority.
4. An unavailable tool produces an honest result and useful recovery path.
5. A budget or stop condition ends the workflow without leaving an unreported partial action.

Protect data integrity and applicable privacy and consent requirements. Make uncertainty visible when it affects a user’s decision. An output should not appear verified merely because it is fluent.

Choose safeguards and evaluation depth for the actual risks. A conventional feature does not need an agent evaluation suite merely because an agent helped write its code.

Related principles: P13, P21, P23, P24, P25, P26.
