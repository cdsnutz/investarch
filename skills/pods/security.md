# Skill: Security Pod

Runs third, on isolation and trust boundaries.

## Checks
- Owner or tenant column on every table holding customer data, with the access rule stated.
- No secret, key or credential stored in the schema.
- No client-supplied price, role or permission treated as an authoritative column.
- Deletion does not orphan dependants: cascade or restrict, deliberately.
- An audit trail exists for anything a buyer will ask about in diligence.
- Paid access, if the product sells one, is derived from a server-verified record, never a user-editable flag.

## Output
Each finding as a concrete exploit or failure path, then the fix.