from fastapi import APIRouter
from app.api.routes import (
    auth,
    users,
    profiles,
    projects,
    research,
    facilities,
    equipment,
    problem_solutions,
    search,
    agents,
    connections,
    documents,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profiles.router)
api_router.include_router(projects.router)
api_router.include_router(research.router)
api_router.include_router(facilities.router)
api_router.include_router(equipment.router)
api_router.include_router(problem_solutions.router)
api_router.include_router(search.router)
api_router.include_router(agents.router)
api_router.include_router(connections.router)
api_router.include_router(documents.router)

