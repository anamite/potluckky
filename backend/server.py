from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --------------- Pydantic Models ---------------

class DishCreate(BaseModel):
    name: str
    description: str = ""
    target_people: int = 30

class DishOut(BaseModel):
    id: str
    name: str
    description: str
    target_people: int
    created_at: str

class ParticipantOut(BaseModel):
    id: str
    name: str
    total_people: int
    kids_above_6: int
    created_at: str

class ContributionOut(BaseModel):
    id: str
    participant_id: str
    dish_id: str
    quantity_people: int
    created_at: str
    participant: Optional[ParticipantOut] = None

class DishWithContributions(BaseModel):
    id: str
    name: str
    description: str
    target_people: int
    created_at: str
    contributions: List[ContributionOut]
    total_contributed: int

class DishEntry(BaseModel):
    dish_choice: str  # "existing" or "new"
    selected_dish_id: str = ""
    new_dish_name: str = ""
    new_dish_description: str = ""
    quantity_people: int = 1

class SubmitContribution(BaseModel):
    name: str
    total_people: int = 1
    kids_above_6: int = 0
    dish_entries: List[DishEntry]

# --------------- Helper ---------------

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# --------------- Routes ---------------

@api_router.get("/")
async def root():
    return {"message": "Potluck Planner API"}

@api_router.get("/dishes/enriched", response_model=List[DishWithContributions])
async def get_dishes_enriched():
    """Get all dishes with their contributions and participant info."""
    dishes = await db.dishes.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    contributions = await db.contributions.find({}, {"_id": 0}).to_list(10000)

    # Build participant lookup
    participant_ids = list({c["participant_id"] for c in contributions})
    participants = await db.participants.find(
        {"id": {"$in": participant_ids}}, {"_id": 0}
    ).to_list(10000)
    p_map = {p["id"]: p for p in participants}

    result = []
    for dish in dishes:
        dish_contribs = [c for c in contributions if c["dish_id"] == dish["id"]]
        enriched_contribs = []
        for c in dish_contribs:
            ec = {**c, "participant": p_map.get(c["participant_id"])}
            enriched_contribs.append(ec)
        total = sum(c["quantity_people"] for c in dish_contribs)
        result.append({
            **dish,
            "contributions": enriched_contribs,
            "total_contributed": total,
        })
    return result

@api_router.get("/dishes", response_model=List[DishOut])
async def get_dishes():
    """Get raw dish list (for form dropdowns)."""
    dishes = await db.dishes.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return dishes

@api_router.post("/dishes", response_model=DishOut)
async def create_dish(body: DishCreate):
    """Create a new dish."""
    # Check for case-insensitive duplicate
    existing = await db.dishes.find_one(
        {"name_lower": body.name.strip().lower()}, {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=409, detail="Dish already exists")

    dish = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "name_lower": body.name.strip().lower(),
        "description": body.description.strip(),
        "target_people": body.target_people,
        "created_at": now_iso(),
    }
    await db.dishes.insert_one(dish)
    # Return without name_lower and _id
    return {k: v for k, v in dish.items() if k not in ("_id", "name_lower")}

@api_router.get("/participants", response_model=List[ParticipantOut])
async def get_participants():
    """Get all participants (newest first)."""
    participants = await db.participants.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    return participants

@api_router.get("/contributions/all")
async def get_all_contributions():
    """Get all contributions with participant info, grouped by dish."""
    dishes = await db.dishes.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    contributions = await db.contributions.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)

    participant_ids = list({c["participant_id"] for c in contributions})
    participants = await db.participants.find(
        {"id": {"$in": participant_ids}}, {"_id": 0}
    ).to_list(10000)
    p_map = {p["id"]: p for p in participants}

    result = []
    for dish in dishes:
        dish_contribs = [c for c in contributions if c["dish_id"] == dish["id"]]
        enriched = []
        for c in dish_contribs:
            enriched.append({**c, "participant": p_map.get(c["participant_id"])})
        total = sum(c["quantity_people"] for c in dish_contribs)
        result.append({
            **dish,
            "contributions": enriched,
            "total_contributed": total,
        })
    return result

@api_router.post("/contributions/submit")
async def submit_contribution(body: SubmitContribution):
    """
    Combined endpoint: create participant, resolve/create dishes, create contributions.
    Mirrors the original Supabase flow.
    """
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not body.dish_entries:
        raise HTTPException(status_code=400, detail="At least one dish entry is required")

    # 1. Create participant
    participant = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "total_people": body.total_people,
        "kids_above_6": body.kids_above_6,
        "created_at": now_iso(),
    }
    await db.participants.insert_one(participant)

    created_contributions = []

    # 2. Process each dish entry
    for entry in body.dish_entries:
        dish_id = entry.selected_dish_id

        if entry.dish_choice == "new":
            normalized = entry.new_dish_name.strip()
            if not normalized:
                raise HTTPException(status_code=400, detail="Dish name is required for new dishes")

            # Check case-insensitive duplicate
            existing = await db.dishes.find_one(
                {"name_lower": normalized.lower()}, {"_id": 0}
            )
            if existing:
                dish_id = existing["id"]
            else:
                new_dish = {
                    "id": str(uuid.uuid4()),
                    "name": normalized,
                    "name_lower": normalized.lower(),
                    "description": entry.new_dish_description.strip(),
                    "target_people": 30,
                    "created_at": now_iso(),
                }
                await db.dishes.insert_one(new_dish)
                dish_id = new_dish["id"]

        if not dish_id:
            raise HTTPException(status_code=400, detail="Dish selection is required")

        qty = max(entry.quantity_people, 1)
        contribution = {
            "id": str(uuid.uuid4()),
            "participant_id": participant["id"],
            "dish_id": dish_id,
            "quantity_people": qty,
            "created_at": now_iso(),
        }
        await db.contributions.insert_one(contribution)
        created_contributions.append({
            "id": contribution["id"],
            "dish_id": dish_id,
            "quantity_people": qty,
        })

    return {
        "success": True,
        "participant_id": participant["id"],
        "contributions": created_contributions,
    }

# --------------- Seed Data ---------------

@app.on_event("startup")
async def seed_data():
    """Seed initial dishes if the collection is empty."""
    count = await db.dishes.count_documents({})
    if count == 0:
        logger.info("Seeding initial dishes...")
        seed_dishes = [
            {"id": str(uuid.uuid4()), "name": "Cabbage thoran", "name_lower": "cabbage thoran", "description": "", "target_people": 30, "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Beeroot pachadi", "name_lower": "beeroot pachadi", "description": "", "target_people": 30, "created_at": now_iso()},
        ]
        await db.dishes.insert_many(seed_dishes)
        logger.info(f"Seeded {len(seed_dishes)} dishes")

    # Create indexes
    await db.dishes.create_index("id", unique=True)
    await db.dishes.create_index("name_lower", unique=True)
    await db.participants.create_index("id", unique=True)
    await db.contributions.create_index("id", unique=True)
    await db.contributions.create_index("dish_id")
    await db.contributions.create_index("participant_id")

# --------------- App Config ---------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
