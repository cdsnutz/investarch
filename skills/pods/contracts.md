# Skill: Contracts Pod

Runs second, on agreement between the layers.

## Checks
- Every field the core logic reads exists in the schema, and every schema column the logic never reads is either justified or removed.
- Money, quantities and rates use types that do not round silently.
- Every status value the logic branches on has a column, an enum and a default.
- The screens implied by the plan can be built from the fields present.
- Server-side validation rules match the constraints in the DDL.

## Output
One sentence per disagreement, naming both sides, then the correction on whichever side is wrong.