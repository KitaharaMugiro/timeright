# Project Instructions for Claude

## Database Migrations

When creating database schema changes:

1. **Always create a migration file** in `supabase/migrations/` with timestamp format: `YYYYMMDDHHMMSS_description.sql`
2. **Always apply the migration immediately** using the Supabase MCP tool:
   ```
   mcp__supabase__apply_migration(name, query)
   ```
3. Do NOT just create the migration file and leave it unapplied
4. After applying, verify with `mcp__supabase__list_migrations` if needed

### Example workflow:
```
1. Create migration file: supabase/migrations/20260201000000_add_new_column.sql
2. Apply using MCP: mcp__supabase__apply_migration("add_new_column", "<SQL content>")
3. Update TypeScript types in src/types/database.ts
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS
- Framer Motion
- LINE LIFF integration
