package utils

type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
	Data    string `json:"data"`
	Time    string `json:"time"`
}
