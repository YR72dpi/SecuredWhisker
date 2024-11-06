package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() map[string]string {
	env := os.Getenv("APP_ENV")
	if env == "" || env == "dev" {
		env = "dev"
	}

	err := godotenv.Load(".env." + env + ".local")
	if err != nil {
		log.Fatal("Error loading .env." + env + ".local file")
	}

	err = godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading ../.env file")
	}

	err = godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	return map[string]string{
		"APP_ENV":        os.Getenv("APP_ENV"),
		"REDIS_PASSWORD": os.Getenv("REDIS_PASSWORD"),
		"VERSION":        os.Getenv("VERSION"),
	}
}
