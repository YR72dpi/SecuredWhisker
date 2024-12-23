package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() map[string]string {

	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading ../.env file")
	}

	return map[string]string{
		"APP_ENV":         os.Getenv("APP_ENV"),
		"REDIS_PASSWORD":  os.Getenv("REDIS_PASSWORD"),
		"VERSION":         os.Getenv("VERSION"),
		"SHOW_ONLY_ERROR": os.Getenv("SHOW_ONLY_ERROR"),
	}
}
