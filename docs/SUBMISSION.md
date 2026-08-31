# Crewboard — submission worksheet

**Draft, not ready to submit.** As of August 31, 2026, this repository contains planning documents only. Replace every bracketed field and validate each claim against the submitted build. Requirements and sources: [challenge checklist](CHALLENGE.md).

## Release details

| Field | Value |
| --- | --- |
| Live application | [URL — not deployed/verified] |
| Public source repository | [URL — public access not verified] |
| Release commit/tag | [SHA/tag] |
| License | [Owner-selected license, file and repository detection checked] |
| Demo video | [Public YouTube URL; measured duration] |
| Tested environment | [Browser, version, WebMCP configuration, date] |
| Demo access | [Instructions; put dedicated test credentials in the submission form, not real credentials in Git] |
| Work provenance | [New work during the challenge; identify any earlier code/assets and their licenses] |

## Description to complete after implementation

### Audience and problem

Crewboard is designed for employees who need to check attendance, leave requests and workplace documents before finishing their day. Its proposed workflow starts with one question: “Do I need to do anything before I finish work today?”

[Describe the actual target team and observed problem. Do not invent customer adoption, time savings or user research.]

### Why WebMCP fits

The planned integration lets a browser agent consult the same workplace data that the employee sees in the dashboard. People can inspect the result and confirm a proposed leave request in the page, while the server enforces the session's permissions.

[Replace this planned description with the behavior verified in the final build. Name the tools used and explain what shared page context contributes.]

### What people and agents do together

[Describe one demonstrated journey: inspect incomplete attendance, let the person correct it, request leave with explicit confirmation, then verify the saved result. Explain the handoff between person and agent. Include document access only if it works in the submitted build.]

### Implementation

[List the actual stack and link to tool registration, input validation, shared server domain functions and authorization code. Explain UI updates, confirmation and error handling using concrete behavior. Do not describe the proposed architecture as implemented.]

### Limitations

[List unavailable features and required browser setup. Explain that the demo uses fictional employees and synthetic documents. State whether upload, draft leave requests and unread-document tracking are implemented.]

## Proposed recording: 2 minutes 40 seconds

This is a suggested product narrative, not a recording or proof of functionality. Rehearse against the deployed build and remove any unavailable step.

| Time | Show | Narration focus |
| --- | --- | --- |
| 0:00–0:20 | Employee dashboard with synthetic data | Who needs this and what remains to do today |
| 0:20–0:55 | Ask the opening question; agent invokes attendance/leave tools | Actual results tied to dates and saved records |
| 0:55–1:15 | Person corrects an incomplete attendance entry in the UI | Human contribution; updated summary read by the agent |
| 1:15–1:55 | Ask for leave, inspect confirmation, confirm and see pending status | One real mutation, shared state, human control |
| 1:55–2:15 | Open an authorized synthetic payslip | Private document access; no real personal data |
| 2:15–2:40 | Brief view of implementation and return to dashboard | Tool registration, common server permissions and current limits |

Film the manager flow separately for testing; add it to the video only if the complete recording remains within S3. Do not simulate a successful tool call with edited text or a hardcoded response.

## Judge walkthrough to finalize

1. Open [live URL] in [tested browser and configuration]. Sign in with the dedicated employee demo account supplied in the submission form.
2. Open [dashboard route]. Confirm the fixture date/month and expected incomplete attendance [date].
3. Ask the opening question. Expected tools/results: [record actual names and fixture values].
4. Correct [entry] in Attendance. Ask for the summary again; expect [persisted result].
5. Ask “Request annual leave from [future date] to [future date].” Check the proposed payload; cancel once and confirm no record was created. Repeat and confirm; expect exactly one pending request.
6. Reload and read leave requests again. Verify the same request remains present.
7. Open [synthetic payslip month]. Confirm successful access; do not expose another employee's document.
8. In a separate manager session, open [Team route], select the pending request and use its ID for approval. Return to the employee session and verify the new state.

Specify how fixtures are restored between trials and which dates the demo uses. Record actual outcomes, including unsupported behavior. Before submission, replace this worksheet with reproducible instructions and remove placeholders.
