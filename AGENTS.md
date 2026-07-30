# AGENT DIRECTIVES & QUALITY CONSTRAINTS

## Core Operating Principles
1. **Never apply band-aid fixes.** If a test or command fails, investigate the root cause. Refactor underlying logic instead of suppressing errors.
2. **Type Safety & Strictness:** 
   - Never use `any`, `@ts-ignore`, or empty `catch {}` blocks.
   - All errors must be explicitly typed or passed to an error handler.
3. **Test-Driven Execution (TDD):**
   - Write or update unit tests BEFORE or alongside feature code.
   - Never consider a task finished until all tests pass cleanly.
4. **Modularity Constraint:**
   - Keep files strictly under 150 lines of code. Split long components or modules logically into separate strategy or utility files.
   - Prefer pure, functional logic over complex object inheritance.

## Mandatory Verification Workflow
Before declaring ANY task complete, you MUST execute:
`npm run verify`

If `npm run verify` outputs ANY error, warning, or type mismatch, you MUST fix it immediately before proceeding.

---

## File Line Count Rule
- **Maximum line limit per file:** 150 lines.
- If a file reaches 140 lines, proactively split helper functions, constants, or sub-components into sibling files (e.g., `srsPlusKicks.ts`, `srsPlusRotation.ts`).

## Architecture Conventions
- Place pure engine logic under `src/engine/`.
- Place strategy pattern interfaces under `src/engine/interfaces/`.
- Place rendering utilities under `src/render/`.
- Place Discord SDK logic under `src/discord/`.