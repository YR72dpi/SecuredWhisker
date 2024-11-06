package utils

import (
	"time"
)

type IndexResponse struct {
	Message  string    `json:"message"`
	DateTime time.Time `json:"dateTime"`
	Status   int       `json:"status"`
}

type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
	Data    string `json:"data"`
	Time    string `json:"time"`
}
