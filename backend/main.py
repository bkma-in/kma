from fastapi import FastAPI

app = FastAPI(title="KMA Backend API")

@app.get("/")
async def root():
    return {"message": "Welcome to the Kerala Mathematical Association API"}
