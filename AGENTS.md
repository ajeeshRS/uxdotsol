<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Editing Rules

- Do not delete and recreate existing files unless explicitly requested.
- Prefer minimal in-place edits with `apply_patch`.
- Preserve file history and local structure.
- For large rewrites, ask before replacing a whole file.
- Never use `Delete File` + `Add File` as a normal editing strategy.

### Run command Rules
- Do not run build/run commands unless explicitly requested.
- Do not run visual checks