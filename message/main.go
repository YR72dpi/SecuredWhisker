package main

import (
	"fmt"
	"log"
	"securedWhisker/db"
	"securedWhisker/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	socketio "github.com/googollee/go-socket.io"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

func main() {
	envData := utils.LoadEnv()
	env := envData["APP_ENV"]
	version := envData["VERSION"]

	app := fiber.New(fiber.Config{
		Prefork:       env != "dev" || env == "",
		CaseSensitive: true,
		StrictRouting: true,
		ServerHeader:  "Secured Whisker " + version,
		AppName:       "Secured Whisker " + version,
	})

	if !fiber.IsChild() {
		utils.Logger("info", "Secured Whisker "+version+" launched !", false)
		utils.Logger("info", "Env: "+env, false)
		utils.Logger("info", "Try to hit the port 8081 to see what happens", false)
	} else {
		utils.Logger("info", "Child process", false)
	}

	// ➤ Setup Socket.IO
	io := socketio.NewServer(nil)

	io.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Println("🔌 Socket.IO connected:", s.ID())
		return nil
	})

	io.OnEvent("/", "message", func(s socketio.Conn, msg string) {
		log.Println("📨 Message received:", msg)
		s.Emit("reply", "Echo: "+msg)
	})

	io.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Println("❌ Socket.IO disconnected:", reason)
	})

	go func() {
		if err := io.Serve(); err != nil {
			log.Fatalf("Socket.IO listen error: %s\n", err)
		}
	}()
	defer io.Close()

	// ➤ Proxy /socket.io/ vers Socket.IO
	app.Use("/socket.io/", func(c *fiber.Ctx) error {
		handler := fasthttpadaptor.NewFastHTTPHandlerFunc(io.ServeHTTP)
		handler(c.Context())
		return nil
	})

	// ➤ Route HTTP standard
	app.Get("/", func(c *fiber.Ctx) error {
		fmt.Print("\n")
		utils.Logger("info", "Access to route", false, "/")

		status := 200
		message := "Ok"

		if !db.ConnectionTest() {
			status = 500
			message = "Database connection error"
		}

		response := utils.IndexResponse{
			Message:  message,
			Status:   status,
			DateTime: time.Now(),
		}

		if status == 500 {
			c.Status(500)
		}

		return c.JSON(response)
	})

	log.Fatal(app.Listen(":8081"))
}
