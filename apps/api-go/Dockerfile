FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api-server ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /bin/api-server /usr/local/bin/api-server

ENV PORT=8080
EXPOSE 8080

CMD ["api-server"]
