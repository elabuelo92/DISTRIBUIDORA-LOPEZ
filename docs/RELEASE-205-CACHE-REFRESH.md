# Release 8790-205: cache refresh for reconciled reports

This follow-up release changes the query-string versions for the updated report and application scripts so browsers fetch the 8790-204 reconciliation instead of reusing the prior cached report bundle.

No business logic or data changes are included. No orders, commissions, balances, stock, or reservations are written.

The release requires the regular backup, integrity, restart, and health checks because the production app serves versioned static assets from its HTML entry point.
