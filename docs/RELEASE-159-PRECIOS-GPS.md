# Release 8790-159

Scoped emergency fix: individual price selection and seller GPS-review synchronization.

- Match canonical product keys exactly, never by substring.
- Reject individual price operations unless exactly one product matches.
- Keep a separate seller full-catalog cursor; partial order responses cannot
  acknowledge unseen customer updates. Reject older in-flight seller snapshots.
- Show GPS sales restriction in the selected customer account summary.
- Increment frontend/cache version for delivery of the updated application.

Verified locally: syntax, exact price target and duplicate/partial selection,
HTTP supplier price flow, GPS mark/submit/reject/approve and seller state delivery,
interleaved order patch regression, label reprint and mixed collections.

No historical price restoration, order migration or changes to operational data.
Deployment requires backup and order integrity comparison. Mobile client confirmation
is required after release; existing open applications must load version 8790-159.
