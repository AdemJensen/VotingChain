package routers

import (
	"backend/config"
	"backend/database"
	"backend/database/models"
	"backend/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

func GetNftContractAddr(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"addr": "0x" + utils.NormalizeHex(config.G.Blockchain.NFTContractAddr)})
}

func CreateVote(c *gin.Context) {
	var request struct {
		VoteAddress string `json:"vote_address"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.VoteAddress = utils.NormalizeHex(request.VoteAddress)
	// create in db
	err := models.InsertVote(database.Db, &models.Vote{
		ContractAddr: request.VoteAddress,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote created"})
}

func PageQueryVotes(c *gin.Context) {
	var request struct {
		Page     int `json:"page"`
		PageSize int `json:"page_size"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if request.Page <= 0 || request.PageSize <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page or page_size"})
		return
	}

	votes, err := models.PageQueryVotes(database.Db, request.Page, request.PageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// count page
	count, err := models.CountVotes(database.Db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"votes":       votes,
		"count":       count,
		"page":        request.Page,
		"page_size":   request.PageSize,
		"total_pages": (count + int64(request.PageSize) - 1) / int64(request.PageSize),
	})
}
