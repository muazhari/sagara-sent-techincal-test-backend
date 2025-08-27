FROM bun:latest

WORKDIR /app
COPY . .

RUN bun install
