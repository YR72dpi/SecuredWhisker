package utils

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// CheckAndCreateDir vérifie si le dossier existe, sinon le crée
func CheckAndCreateDir(dirPath string) {
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		err := os.Mkdir(dirPath, os.ModePerm)
		if err != nil {
			fmt.Println("Erreur de création du dossier:", err)
		}
	}
}

// Logger écrit le log dans un fichier selon le niveau donné, avec logrus
func Logger(level string, message string, writeInFile bool, data ...interface{}) {
	level = strings.ToLower(level)

	if len(data) != 0 {
		fmt.Println("["+time.Now().Format("2006-01-02 15:04:05")+"]"+"["+level+"] "+message, data)
	} else {
		fmt.Println("[" + time.Now().Format("2006-01-02 15:04:05") + "]" + "[" + level + "] " + message)
	}

	if writeInFile {

		CheckAndCreateDir("./log")
		fileName := "./log/" + level + ".log"
		dataStr := fmt.Sprintf("["+level+"] %v", data)

		logEntry := LogEntry{
			Level:   level,
			Message: message,
			Data:    dataStr,
			Time:    time.Now().Format(time.RFC3339),
		}

		// Initialiser le logger
		logger := logrus.New()
		logger.SetFormatter(&logrus.JSONFormatter{})

		// Configurer la sortie du logger vers le fichier
		file, err := os.OpenFile(fileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			fmt.Println("Erreur d'ouverture du fichier :", err)
			return
		}

		defer file.Close()
		logger.SetOutput(file)

		// Définir le niveau de log en fonction du paramètre level
		switch level {
		case "info":
			logger.WithFields(logrus.Fields{
				"data": logEntry.Data,
			}).Info(logEntry.Message)
		case "error":
			logger.WithFields(logrus.Fields{
				"data": logEntry.Data,
			}).Error(logEntry.Message)
		case "warn":
			logger.WithFields(logrus.Fields{
				"data": logEntry.Data,
			}).Warn(logEntry.Message)
		default:
			logger.WithFields(logrus.Fields{
				"data": logEntry.Data,
			}).Print(logEntry.Message)
		}
	}

}
