# Release 8790-160

## Scope
- Product-specific price editor: cost and five list prices, with editable markup or final price.
- Exact product identifier, stale-edit rejection, explicit below-cost confirmation, administrative audit.
- Reuses the existing administrative price endpoint; does not rewrite orders or allocate stock.
- Responsive editor checked at desktop and 390px width.
- Retains release 159 exact-match and seller GPS/catalog synchronization protections.

## Recovery
The optional deployment flag `--recover-price-incident` restores only the reviewed price-list incident identified in `scripts/recover-price-incident-20260928.js`.
It requires exactly 31 pending corrections, 32 unique original audit entries, no later edits and matching current prices. The already corrected product is skipped. It never uses a substring to select products for writes.
ERP must be stopped; a data backup and individual state copy precede the atomic replacement. Product identifiers, stock, costs, other list columns, orders and clients are preserved. Each correction receives an audit entry. Existing order prices are not retroactively changed.

## Validation
- `node scripts/smoke-price-recovery-160.js`
- `node scripts/smoke-suppliers-prices-v115.js` (includes HTTP five-list save, conflict and below-cost checks)
- `node scripts/smoke-price-exact-target.js`
- `node scripts/smoke-seller-catalog-sync.js`
- `node scripts/smoke-client-gps-review-v135.js`
- `node scripts/smoke-cache-update-v126.js`
- Syntax checks for server and frontend.

Production deployment requires backup, offline recovery, order-snapshot comparison, independent price comparison, health/license checks and public asset verification. Browser tests use demo data; real mobile session confirmation remains a separate operational check.
