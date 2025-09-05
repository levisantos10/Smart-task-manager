from fastapi import FastAPI

app = FastAPI(title="Smart Task Manager API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Smart Task Manager API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    