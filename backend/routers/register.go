package routers

import (
	"backend/database"
	"backend/database/models"
	"backend/middlewares"
	"github.com/gin-gonic/gin"
	"net/http"
)

func RegisterUser(c *gin.Context) {
	var request struct {
		Email    string `json:"email"`
		Nickname string `json:"nickname"`
	}
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	walletAddr := middlewares.GetWalletAddr(c)
	if walletAddr == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "User not verified"})
		return
	}
	if exists, err := models.UserExists(database.Db, walletAddr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user: " + err.Error()})
		return
	} else if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	user := &models.User{
		Email:      request.Email,
		Nickname:   request.Nickname,
		Role:       models.RoleUser,
		WalletAddr: walletAddr,
		CreateTime: 0,
	}
	if err := models.InsertUser(database.Db, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert user: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User registered", "user": user})
}
