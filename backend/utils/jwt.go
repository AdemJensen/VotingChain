package utils

import (
	"backend/config"
	"github.com/golang-jwt/jwt/v4"
	"github.com/pkg/errors"
	"time"
)

func GenerateJWT(walletAddr string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"wallet": walletAddr,
		"time":   time.Now().Unix(),
		"key":    config.G.Server.JWTKey,
	})
	tokenString, _ := token.SignedString(config.G.Server.JWTSecret)
	return tokenString
}

func VerifyJWT(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.G.Server.JWTSecret), nil
	})
	if err != nil {
		return "", errors.Wrapf(err, "failed to parse token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}
	if config.G.Server.JWTKey != claims["key"].(string) {
		return "", errors.New("token key has changed, please re-login")
	}
	if time.Now().Sub(time.Unix(claims["time"].(int64), 0)) > time.Hour*time.Duration(config.G.Server.JWTExpireHr) {
		return "", errors.New("token expired")
	}
	return claims["wallet"].(string), nil
}
