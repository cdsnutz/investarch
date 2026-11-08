# Skill: Structure Pod

Runs first, on the data model alone.

## Checks
- Every entity the solution names has a table.
- Every table has a primary key, and every relationship has a foreign key with the right delete behaviour.
- Uniqueness where a duplicate would corrupt a record (tenant plus email, tenant plus slug, one active subscription per account).
- An index on every column the screens filter or sort by.
- Created and updated timestamps on mutable tables.

## Output
Each gap as one sentence naming the table or column, then the DDL that closes it. No general advice.