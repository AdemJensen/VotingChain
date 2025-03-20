package utils

import (
	"backend/config"
	"github.com/golang-jwt/jwt/v4"
	"github.com/pkg/errors"
	"strconv"
	"time"
)

func GenerateJWT(walletAddr string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"wallet": walletAddr,
		"time":   strconv.FormatInt(time.Now().Unix(), 10),
		"key":    config.G.Server.JWTKey,
	})
	tokenString, err := token.SignedString([]byte(config.G.Server.JWTSecret))
	if err != nil {
		panic(errors.Wrapf(err, "failed to sign token"))
	}
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
	ts := claims["time"].(string)
	t, _ := strconv.ParseInt(ts, 10, 64)
	if time.Now().Sub(time.Unix(t, 0)) > time.Hour*time.Duration(config.G.Server.JWTExpireHr) {
		return "", errors.New("token expired")
	}
	return claims["wallet"].(string), nil
}
