# Potluck Planner - PRD

## Original Problem Statement
Fix two bugs:
1. Number input fields (Total People, Kids Above 6, cook quantity) always show sticky "0" that can't be removed via backspace
2. One person should have the option to add more than one dish on their name

## Architecture
- **Frontend**: React CRA (port 3000) with Tailwind CSS
- **Backend**: Supabase (direct client-side connection, no FastAPI backend needed for data)
- **Database**: Supabase PostgreSQL with tables: participants, dishes, contributions

## User Personas
- **Potluck Participant**: Signs up to cook dishes, specifies people count
- **Admin**: Views all participants, dishes, contributions, exports CSV (password: potluck2024)

## Core Requirements
- Home page with dish status cards (progress bars, contributors)
- Contribution form with person info + dish selection
- Admin page with stats, tables, CSV export

## What's Been Implemented (Jan 2026)
- Ported Next.js app to React CRA on Emergent platform
- **Bug Fix 1**: Changed number inputs from `type="number"` to `type="text"` with `inputMode="numeric"` — allows fully clearing fields via backspace (no sticky "0")
- **Bug Fix 2**: Added dynamic dish entries array with "+ Add Another Dish" button — each person can add multiple dishes, each with its own Join Existing / Create New toggle, dish selector, and quantity field. Trash icon to remove entries (min 1 required).
- All tests passed (14/15 features, 95% pass rate)

## Prioritized Backlog
- P2: Enhanced form validation visual feedback for edge cases
- P2: Responsive mobile improvements

## Next Tasks
- User review and feedback
