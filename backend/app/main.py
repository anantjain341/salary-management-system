from fastapi import FastAPI

app = FastAPI(title="Salary Management System API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Salary Management System API"}
