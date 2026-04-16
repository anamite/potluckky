# Potluck Planner - PRD

## Original Problem Statement
1. Fix sticky "0" in number inputs (Total People, Kids Above 6, cook quantity)
2. Allow one person to add more than one dish on their name
3. Migrate from Supabase to proper MongoDB backend

## Architecture
- **Frontend**: React CRA (port 3000) with Tailwind CSS
- **Backend**: FastAPI (port 8001)
- **Database**: MongoDB (local, via MONGO_URL env var)
- **Collections**: `dishes`, `participants`, `contributions`

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dishes | Raw dish list (for dropdowns) |
| GET | /api/dishes/enriched | Dishes with contributions & participant info |
| GET | /api/participants | All participants (newest first) |
| GET | /api/contributions/all | All contributions grouped by dish |
| POST | /api/dishes | Create new dish |
| POST | /api/contributions/submit | Combined: create participant + resolve/create dishes + create contributions |

## Database Schema (MongoDB)
### dishes
- id (UUID string), name, name_lower (case-insensitive index), description, target_people, created_at

### participants
- id (UUID string), name, total_people, kids_above_6, created_at

### contributions
- id (UUID string), participant_id, dish_id, quantity_people, created_at

## User Personas
- **Potluck Participant**: Signs up to cook dishes, specifies people count
- **Admin**: Views all participants, dishes, contributions, exports CSV (password: potluck2024)

## What's Been Implemented (Jan 2026)
- **Bug Fix 1**: Number inputs use `type="text"` with `inputMode="numeric"` - fully clearable
- **Bug Fix 2**: Dynamic `dishEntries` array with "+ Add Another Dish" button, trash icon to remove
- **Migration**: Complete Supabase → MongoDB migration
  - FastAPI backend with all CRUD endpoints
  - Proper MongoDB collections with indexes
  - Seed data on startup (2 dishes)
  - Frontend calls backend API via axios instead of Supabase client
- All tests passed: Backend 100% (13/13), Frontend 100%

## Prioritized Backlog
- P2: Enhanced mobile responsiveness for multi-dish form
- P2: Visual form validation feedback improvements

## Next Tasks
- User review and feedback
