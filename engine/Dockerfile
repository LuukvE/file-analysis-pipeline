FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./src ./src
ENV PORT 8000
EXPOSE 8000
CMD sh -c "uvicorn src.main:app --host 0.0.0.0 --port ${PORT} --timeout-keep-alive 300"
