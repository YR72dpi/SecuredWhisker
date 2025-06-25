package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() map[string]string {

	// TODO : 2025/06/24 20:13:06 Error loading ../.env file on docker
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading ../.env file")
	}

	return map[string]string{
		"APP_ENV":         os.Getenv("APP_ENV"),
		"VERSION":         os.Getenv("VERSION"),
		"SHOW_ONLY_ERROR": os.Getenv("SHOW_ONLY_ERROR"),
	}
}
