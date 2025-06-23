package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

func CheckAndCreateDir(dirPath string) {
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		err := os.Mkdir(dirPath, 0750)
		if err != nil {
			fmt.Println("Erreur de création du dossier:", err)
		}
	}
}

func Logger(level, message string, writeInFile bool, data ...interface{}) {
	level = strings.ToLower(level)
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logMessage := fmt.Sprintf("[%s][%s] %s", timestamp, level, message)

	if !(LoadEnv()["SHOW_ONLY_ERROR"] == "true" && (level == "info" || level == "print")) {
		if len(data) != 0 {
			fmt.Println(logMessage, data)
		} else {
			fmt.Println(logMessage)
		}
	}

	if writeInFile {
		writeLogToFile(level, message, data)
	}
}

func writeLogToFile(level, message string, data []interface{}) {
	CheckAndCreateDir("./log")

	validLevels := map[string]bool{
		"info":  true,
		"error": true,
		"warn":  true,
	}

	if !validLevels[level] {
		fmt.Println("Niveau de log invalide :", level)
		return
	}

	baseLogDir := "./log"
	fileName := fmt.Sprintf("%s/%s.log", baseLogDir, level)

	// Ensure fileName is inside baseLogDir (cross-platform)
	absBase, err1 := filepath.Abs(baseLogDir)
	absFile, err2 := filepath.Abs(fileName)
	if err1 != nil || err2 != nil {
		fmt.Println("Erreur lors de la résolution du chemin :", err1, err2)
		return
	}
	if !strings.HasPrefix(absFile, absBase) {
		fmt.Println("Path outside authorized directory:", absFile)
		return
	}

	dataStr := fmt.Sprintf("%v", data)
	logEntry := LogEntry{
		Level:   level,
		Message: message,
		Data:    dataStr,
		Time:    time.Now().Format(time.RFC3339),
	}

	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})

	file, err := os.OpenFile(fileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		fmt.Println("Erreur d'ouverture du fichier :", err)
		return
	}
	defer file.Close()
	logger.SetOutput(file)

	logWithLevel(logger, level, logEntry)
}

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
