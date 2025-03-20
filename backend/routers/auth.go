package routers

import (
	"backend/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

var authChallenges = make(map[string]string)

func GenAuthChallenge(c *gin.Context) {
	var request struct {
		WalletAddr string `json:"wallet_address"`
	}
	// generate a challenge set
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddr = utils.NormalizeHex(request.WalletAddr)

	challenge := utils.GenerateChallenge()
	authChallenges[request.WalletAddr] = challenge
	c.JSON(http.StatusOK, gin.H{"challenge": challenge})
}

func VerifyAuthChallenge(c *gin.Context) {
	var request struct {
		WalletAddr string `json:"wallet_address"`
		Signature  string `json:"signature"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddr = utils.NormalizeHex(request.WalletAddr)
	request.Signature = utils.NormalizeHex(request.Signature)

	challenge, ok := authChallenges[request.WalletAddr]
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "No challenge found"})
		return
	}

	if err := utils.VerifyChallenge(challenge, request.Signature, request.WalletAddr); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Verification err: " + err.Error()})
		return
	}

	token := utils.GenerateJWT(request.WalletAddr)
	c.JSON(http.StatusOK, gin.H{"token": token})
}
