package utils

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

func CheckAndCreateDir(dirPath string) {
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		err := os.Mkdir(dirPath, os.ModePerm)
		if err != nil {
			fmt.Println("Erreur de création du dossier:", err)
		}
	}
}

func Logger(level, message string, writeInFile bool, data ...interface{}) {
	level = strings.ToLower(level)
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logMessage := fmt.Sprintf("[%s][%s] %s", timestamp, level, message)

	// Vérifie si l'affichage en console est nécessaire en fonction de l'environnement et du niveau de log
	if !(LoadEnv()["SHOW_ONLY_ERROR"] == "true" && (level == "info" || level == "print")) {
		if len(data) != 0 {
			fmt.Println(logMessage, data)
		} else {
			fmt.Println(logMessage)
		}
	}

	// Ecrit le log dans un fichier si nécessaire
	if writeInFile {
		writeLogToFile(level, message, data)
	}
}

// Fonction utilitaire pour écrire le log dans un fichier
func writeLogToFile(level, message string, data []interface{}) {
	CheckAndCreateDir("./log")
	fileName := fmt.Sprintf("./log/%s.log", level)

	// Formatage des données supplémentaires en chaîne
	dataStr := fmt.Sprintf("%v", data)
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

	// Écrit le message dans le fichier en fonction du niveau
	logWithLevel(logger, level, logEntry)
}

// Fonction utilitaire pour définir le niveau de log et écrire le message
func logWithLevel(logger *logrus.Logger, level string, entry LogEntry) {
	fields := logrus.Fields{"data": entry.Data}
	switch level {
	case "info":
		logger.WithFields(fields).Info(entry.Message)
	case "error":
		logger.WithFields(fields).Error(entry.Message)
	case "warn":
		logger.WithFields(fields).Warn(entry.Message)
	default:
		logger.WithFields(fields).Print(entry.Message)
	}
}
