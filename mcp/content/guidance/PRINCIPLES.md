# Coding and review principles

Use DEVELOPMENT_GUIDELINES.md for the central human-readable guide. This reference lists the individual principles and their application limits.

All examples are fictional. They establish no requirement to find a particular function, dependency, repository or historical implementation. Apply these principles to the code or design supplied for the current review.

Support labels describe the basis of a preference. Strong means recurring observed support; contextual means application depends on the situation; stated means explicitly supplied guidance, without implying formally adopted organizational policy. None of these labels determines finding severity.

## P01 Keep each change focused and reviewable

**Support: strong. Scope: general.**

Separate unrelated changes and risky refactors. Keep related changes together when they form one complete behavior. Establish coverage before refactoring critical paths.

**Example:** First add coverage for a critical request handler. Then refactor the handler in a separate change while keeping its behavior the same. A cosmetic rename can be a follow-up.

**Apply with judgment:** Do not request a stack solely because a diff is large. Explain the independent behaviors or release dependencies that justify splitting it.

## P02 Solve current needs with proportionate complexity

**Support: strong. Scope: general.**

Require a concrete use case for new options, services, abstractions and dependencies. Reuse established solutions when they preserve the required behavior. Assess the full cost of a solution, including review, rework, latency, operation and future maintenance.

**Example:** Start with one scheduled job for a periodic import. Add a separate service only when independent scaling, ownership or reliability requirements justify it.

**Apply with judgment:** Several concrete cases can justify an abstraction. Simplicity is assessed through behavior and operating cost, rather than file count or line count.

## P03 Give each component a clear responsibility

**Support: strong. Scope: general.**

Keep transport, parsing, domain decisions, persistence and presentation responsibilities explicit. Put a decision with the component that owns its meaning.

**Example:** Split downloading from parsing. A title helper returns a title; the caller assigns it. A reusable timer accepts a reporting callback instead of knowing a particular storage backend.

**Apply with judgment:** Extract responsibilities when doing so makes ownership or dependencies clearer. Extra forwarding functions can also obscure the flow.

## P04 Make inputs and dependencies visible

**Support: strong. Scope: general.**

Prefer explicit parameters and return values over hidden instance-variable assignments or configuration reads buried inside reusable functions. Expose dependencies where this improves testing.

**Example:** A file parser receives its input path. An external client receives its connection settings. Tests can supply controlled inputs without changing hidden global state.

**Apply with judgment:** Use ordinary framework conventions where appropriate. A dependency-injection framework is not implied by this preference.

## P05 Use names that explain the actual behavior

**Support: strong. Scope: general.**

Use consistent domain vocabulary, language conventions and meaningful names for important literals. A name should distinguish what the function actually does.

**Example:** Use a name such as prioritize_items when a function changes ordering. A name such as filter_items would imply that it removes results. Name a business threshold so its purpose is visible.

**Apply with judgment:** Naming and constant extraction are usually suggestions. Escalate only when ambiguity causes a concrete incorrect use or contract mismatch.

## P06 Keep control flow easy to follow

**Support: strong. Scope: general.**

Use guard clauses, pattern matching and small cohesive operations to reduce nesting and the state a reader must remember. Remove redundant transformations or checks.

**Example:** Return early for an irrelevant event. Match active, inactive and invalid mapping results directly instead of routing through several opaque forwarding helpers.

**Apply with judgment:** Choose the clearest local expression. Neither more helpers nor fewer helpers is an absolute rule.

## P07 Preserve one coherent contract across layers

**Support: strong. Scope: general.**

Reuse the existing canonical mapping or shared interface. Keep provider-specific interpretation in the provider layer. Check that wrappers preserve the full meaning of their inputs and outputs.

**Example:** An error adapter preserves code, message, recovery, retry and selected-resource context. A provider-specific classifier delegates through that contract without adding a competing normalization layer.

**Apply with judgment:** Local adaptation can be appropriate when sharing would create deployment coupling. Document the reuse choice and preserve the relevant contract tests.

## P08 Keep failures distinguishable and actionable

**Support: strong. Scope: general.**

Distinguish intentional no-ops, invalid input, permanent failures and temporary failures. Preserve useful failure context and recovery instructions through dispatch and telemetry. In partial batches, retain successful items while exposing the failed items clearly.

**Example:** Missing required configuration produces a failure with a useful reason. An event outside the supported scope can produce a documented no-op. Keep these outcomes distinct.

**Apply with judgment:** Do not turn every exception into a retry. Classification must match the actual failure and provider contract.

## P09 Reconcile uncertain writes before retrying

**Support: strong. Scope: external mutations.**

A timeout, exception or malformed success response can leave the external result unknown. Preserve the selected resource and tell the caller how to discover current state before repeating a write.

**Example:** An external service returns a success status with an unreadable body. Record the outcome as uncertain and check the resource state before submitting the update again.

**Apply with judgment:** Keep supported validate-only behavior intact. Validation success and an applied mutation are different states.

## P10 Make state transitions recoverable and consistent

**Support: strong. Scope: stateful workflows.**

Mark work complete after the required operation succeeds. Use transactions for database changes that must succeed together. Consider replay, interrupted runs and concurrent state changes.

**Example:** Persist a state change and its required background job in one transaction. Consider what happens if a user reverses the state change while the job is still running.

**Apply with judgment:** A status check alone does not prove atomic ownership or exactly-once delivery. Identify the actual coordination mechanism when concurrency matters.

## P11 Bound work and measure the real bottleneck

**Support: strong. Scope: data and background processing.**

Check realistic data volumes, query plans, batch sizes, paging termination, timeouts and total concurrency. Move long operations off interactive paths where necessary.

**Example:** A cleanup can grow from hundreds to millions of rows. Bound each batch. If three tasks each launch four requests, account for twelve concurrent requests.

**Apply with judgment:** Propose optimization with a concrete workload or measurement. Choose batch sizes and concurrency limits for the actual system.

## P12 Make production behavior observable without creating noise

**Support: strong. Scope: general.**

Capture identifiers, causes and useful state transitions. Verify that errors actually reach the monitoring system with usable severity and context. Choose alerts around operational or business impact.

**Example:** Report a mismatch that would otherwise drop valid records silently. Include enough context to identify the failed operation. Sample repetitive events when recording all of them would hide useful signals.

**Apply with judgment:** Protect credentials and personal data. Optional analytics should not take down a business operation; mandatory audit behavior follows the applicable requirements.

## P13 Test the behavior through the boundary where it can fail

**Support: strong. Scope: general.**

Exercise the complete relevant scenario and assert meaningful outcomes. Cover missing inputs, ordering, filters, paging and errors where those behaviors matter. Validate adapters together when the defect crosses their boundary. External-response fixtures must reflect the actual provider contract; repeating an invented response shape in both code and test proves little. Use independent checks of requirements and domain rules when implementation and tests could share the same assumption.

**Example:** Pagination tests fetch page two and verify its contents and ordering. An uncertain-write regression sends an actual mocked HTTP 200 malformed response through the provider and tool path.

**Apply with judgment:** Use the cheapest test layer that catches the failure. Extra end-to-end machinery should demonstrate distinct value.

## P14 Keep test setup small and explicit

**Support: strong. Scope: general.**

Show the data that matters near the test. Avoid broad conditional setup, unnecessary inserted rows and factories that hide business behavior. Name scenarios so a reader can follow the state changes.

**Example:** Create only the fields needed for a filter test. Label deletion and update events clearly in a batch. Build a value without inserting it when persistence is irrelevant.

**Apply with judgment:** Shared setup remains useful for common infrastructure and cleanup. Do not enforce a universal ban on setup, mocks, or multiple assertions.

## P15 Isolate tests and restore shared state

**Support: strong. Scope: general.**

Keep test databases, topics and object-storage data isolated from development or live resources. Restore global configuration, including whether a key originally existed.

**Example:** Tests use a dedicated data namespace. A test that changes shared configuration records its original state and restores the value or removes the key afterward.

**Apply with judgment:** Infrastructure can be shared when the data namespaces remain isolated. Apply stricter offline guards to tests that hold live provider credentials.

## P16 Check the running path and deployment configuration

**Support: strong. Scope: runtime and integration changes.**

Trace the feature through registration, configuration, supervision, serialization and the consumer-facing interface. Compare environments when a configuration change is involved. Distinguish implementation completion, deployment and release to users; verify the intended outcome at the relevant stage.

**Example:** A new handler also needs registration in the interface that exposes it. A worker-only process should not require web authentication settings or fail when an unrelated web component stops.

**Apply with judgment:** Release-binary tests can find wiring failures, but test harness cost still needs justification through meaningful scenarios.

## P17 Preserve domain meaning and consumer compatibility

**Support: strong. Scope: data and public interfaces.**

Check the meanings of nulls, timestamps, identifiers, sorting, units and aggregation grain. Verify the impact on existing consumers before changing a shared default.

**Example:** Changing a default sort order affects existing clients. Distinguish source timestamps from ingestion timestamps. Preserve the difference between an unknown measurement and zero.

**Apply with judgment:** A migration can intentionally change a contract, but the change and affected consumers must be explicit.

## P18 Remove obsolete code as part of finishing work

**Support: strong. Scope: general.**

Remove unused code, obsolete implementations, commented-out configuration and stale fixtures when they are safely within scope. Reduce lint exclusions when practical. Keep tests, documentation, prompts, repository instructions and automation workflows aligned with the system. Remove generated artifacts that no longer provide value.

**Example:** After replacing processors, delete the old processors and related code. Update fixtures when the upstream fields they contain no longer exist.

**Apply with judgment:** Keep risky or unrelated cleanup in a separate change. Do not use cleanup as a reason to expand every PR.

## P19 Explain changes and tradeoffs in simple language

**Support: strong. Scope: general.**

Explain what changed, why it matters and any non-obvious choice. Describe workflows in order. Keep review and PR text short, concrete and easy to act on.

**Example:** Read data → check completeness → save a timestamped result. A review finding names the trigger, incorrect outcome, affected line and smallest useful fix.

**Apply with judgment:** Keep routine explanations concise. Add detail when a consequential decision, limitation or verification result needs it.

## P20 Keep the review focused and calibrated

**Support: strong. Scope: review process.**

Check explicit requirements and changed behavior. Read enough surrounding code to trace the issue. Avoid duplicate comments and unrelated historical issues. Supply a concrete fix for a finding.

**Example:** A pre-existing deployment smoke-test URL can be a follow-up. A naming improvement remains a suggestion when behavior is clear. A lost recovery contract warrants a required change.

**Apply with judgment:** Respect the requested review mode: architecture review may examine proposed boundaries; PR review should anchor findings to the changed behavior. Existing automated convention checks should not be repeated.

## P21 Match architecture effort to release impact and reversibility

**Support: contextual. Scope: architecture review.**

Assess user and business impact, sensitive data, irreversible changes, failure isolation, monitoring and rollback. Prefer a design the owner can explain, including its failure points. Consider data integrity, privacy and consent requirements when choosing safeguards. Make material limitations visible to affected users.

**Example:** A small reversible internal release can use a simple design and follow-up review. A migration affecting important persisted data needs earlier design and release planning.

**Apply with judgment:** Agree on rollback and validation requirements for the actual release. Timing thresholds depend on impact and operating constraints.

## P22 Treat agent-facing descriptions as executable contracts

**Support: contextual. Scope: agent interfaces and automation.**

Descriptions, annotations and errors must match actual capabilities, write scope and recovery behavior. Verify provider-specific semantics and money units against the relevant version before making factual claims.

**Example:** A validate-only response does not prove an applied after-state. A status update changes only status. An annotation declaring a write read-only can mislead the caller.

**Apply with judgment:** Verify capabilities and interface details against the version used in the supplied system. A generic example does not establish the behavior of any particular dependency.

## P23 Measure outcomes and keep feedback cycles sustainable

**Support: stated. Scope: planning and delivery.**

Define the user or business outcome before implementation. Validate valuable assumptions early, reassess direction as evidence changes, and stop work that no longer delivers enough value. Limit parallel work to what can be integrated, reviewed and operated responsibly.

**Example:** Before expanding an import workflow, verify that users need the additional data. Finish and validate one useful slice before opening several dependent changes that nobody can review.

**Apply with judgment:** Code volume, generated changes and automation activity are not sufficient measures of success. Choose feedback and concurrency limits for the actual team and work; no fixed threshold is implied.

## P24 Keep ownership and shared capabilities clear

**Support: stated. Scope: architecture and delivery.**

Keep an accountable engineer or team for each change, including delegated work. Consider effects on other teams, make dependencies visible and reuse supported shared capabilities where they meet the need. Document deliberate exceptions and keep setup, interfaces and knowledge maintainable by others.

**Example:** A new import uses a maintained connector when it fits. If it needs a different approach, record the missing capability and tradeoff. Identify who will support the result after release.

**Apply with judgment:** Shared infrastructure is useful when it fits the requirements. This preference does not require a central service for every capability or a new approval gate for routine implementation choices.

## P25 Choose automation deliberately and bound its authority

**Support: stated. Scope: automation and agents.**

Use deterministic automation for known rules and agents where interpretation or exploration adds value. Give agents clear goals, appropriate data and tools, bounded access, action limits, time and cost budgets, and defined stop or human-review conditions. Scale autonomy to failure impact and reversibility, and preserve useful evidence of important actions.

**Example:** A scheduled import with fixed transformations uses an ordinary job. An agent investigating unfamiliar failures receives read-only access and a bounded investigation budget; any live write needs the authority required for that action.

**Apply with judgment:** Apply these checks to the automation being designed or changed. Use the current task authority and applicable requirements; do not add approval prompts for already authorized routine work or impose arbitrary budget values.

## P26 Evaluate agent behavior and protect user trust

**Support: stated. Scope: products using agents or generated outputs.**

Evaluate representative tasks, failure cases and harmful or misleading inputs. Reassess behavior after changes to models, prompts, tools or data. Protect data integrity, privacy and consent requirements, make decision-relevant uncertainty visible, and provide a practical way to stop or recover from unacceptable behavior.

**Example:** After changing an assistant prompt, check an ordinary request, missing information, a misleading retrieved instruction and an unavailable tool. Verify that unsupported claims remain qualified and that the workflow can stop safely.

**Apply with judgment:** Choose evaluations and safeguards for the actual product risks. Apply behavioral evaluation to changed agent behavior; conventional software does not require an agent-specific evaluation suite merely because development used an agent.
