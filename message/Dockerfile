# Build stage
FROM golang:1.23 AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server

# Ensure the binary has the correct permissions
RUN chmod +x /app/server

##############################################################
# Runtime stage
FROM gcr.io/distroless/static

WORKDIR /

# Copy the binary from the builder stage
COPY --from=builder /app/server /server

# Expose the port
EXPOSE 8080

# Command to run the server
CMD ["/server"]
