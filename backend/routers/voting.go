package routers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func CreateVoting(c *gin.Context) {
	//var request struct {
	//	Title          string `json:"title"`
	//	CreatorAddress string `json:"creator_address"`
	//	PrivateKey     string `json:"private_key"` // 由前端传入
	//}

	//if err := c.BindJSON(&request); err != nil {
	//	c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
	//	return
	//}
	//
	//if !isAdmin(request.CreatorAddress) {
	//	c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
	//	return
	//}
	//
	//votingAddress := deployVoting(request.PrivateKey)
	//saveVotingToDB(request.Title, votingAddress, request.CreatorAddress)
	//
	//c.JSON(http.StatusOK, gin.H{"message": "Voting created", "contract": votingAddress})
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Not implemented"})
}
