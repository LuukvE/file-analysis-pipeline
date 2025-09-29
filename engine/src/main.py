from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/")
async def get_file_size(file: UploadFile = File(...)):
    total_size = 0

    while chunk := await file.read(1024 * 1024):
        total_size += len(chunk)

    return JSONResponse(content={"size": total_size})
