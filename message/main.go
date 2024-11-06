package main

import (
	"fmt"
	"securedWhisker/db"
	"securedWhisker/utils"
	"time"

	"github.com/gofiber/fiber/v2"
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

	app.Get("/", func(c *fiber.Ctx) error {
		fmt.Print("\n")
		utils.Logger("info", "Access to route", false, "/")

		status := 200
		message := "Ok"

		// verifier la co à l'autre microservices
		connectDb := db.ConnectionTest()
		if !connectDb {
			status = 500
			message = "Database connection error"
		}

		response := utils.IndexResponse{
			Message:  message,
			Status:   status,
			DateTime: time.Now(),
		}

		if status == 500 {
			c.Context().SetStatusCode(500)
		}

		return c.JSON(response)
	})

	app.Listen(":8081")
}
