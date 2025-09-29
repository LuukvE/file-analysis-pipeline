from fastapi import FastAPI, Request

app = FastAPI()


@app.post("/")
async def process_stream(request: Request):
    bytes_received = 0
    async for chunk in request.stream():
        bytes_received += len(chunk)

    return {"size": bytes_received}
