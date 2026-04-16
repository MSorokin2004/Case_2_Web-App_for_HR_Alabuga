from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, resumes, files, interviews
from app.routers import auth, resumes, files, interviews, notifications

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="HR Marketplace MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(files.router)
app.include_router(interviews.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"message": "HR API is running"}


