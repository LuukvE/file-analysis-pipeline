from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from io import BytesIO

app = FastAPI()


@app.post("/")
async def incoming(request: Request):
    print("File entered the engine")

    stream_buffer = BytesIO()

    async for chunk in request.stream():
        stream_buffer.write(chunk)

    stream_buffer.seek(0)

    total_size = len(stream_buffer.getvalue())

    print(total_size)

    return JSONResponse(content={"size": total_size})
