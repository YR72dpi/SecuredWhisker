package db

import (
	"context"
	"fmt"
	"log"
	"securedWhisker/utils"

	"github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func getConnection() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",                  // Adresse du serveur Redis
		Password: utils.LoadEnv()["REDIS_PASSWORD"], // Mot de passe (laisser vide si pas de mot de passe)
		DB:       0,                                 // Utiliser la base de données par défaut
	})
}

func ConnectionTest() bool {
	utils.Logger("info", "Redis: Testing connection", false)
	rdb := getConnection()
	err := rdb.Ping(ctx).Err()
	if err != nil {
		utils.Logger("Error", "Error connecting to Redis", true, err)
		return false
	}
	utils.Logger("info", "Redis: Connection ok", false)
	return true
}

func Db() {
	rdb := getConnection()

	// Définir une valeur dans Redis
	err := rdb.Set(ctx, "key", "value", 0).Err()
	if err != nil {
		log.Fatalf("Erreur lors de la définition de la clé : %v", err)
	}

	// Récupérer la valeur
	val, err := rdb.Get(ctx, "key").Result()
	if err != nil {
		log.Fatalf("Erreur lors de la récupération de la clé : %v", err)
	}
	fmt.Println("La valeur de 'key' est :", val)

	// Suppression de la clé
	err = rdb.Del(ctx, "key").Err()
	if err != nil {
		log.Fatalf("Erreur lors de la suppression de la clé : %v", err)
	}

	fmt.Println("Clé 'key' supprimée.")
}
