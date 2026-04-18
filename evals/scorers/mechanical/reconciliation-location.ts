/**
 * Ballot checklist item 8 — Reconciliation Location.
 * A ballot must not contain a Reconciliation heading.
 * Reconciliation belongs in the sessionlog, not the ballot.
 *
 * Note: the "no sibling DOSSIER-*-RECONCILE.md" check requires filesystem
 * access and is not covered by this static-content scorer.
 */
export function scoreReconciliationLocation(content: string): number {
  if (/^#{1,3}\s+reconciliation\b/im.test(content)) return 0;
  return 1;
}
