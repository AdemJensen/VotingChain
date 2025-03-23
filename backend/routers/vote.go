package routers

import (
	"backend/biz/vote"
	"backend/config"
	"backend/database"
	"backend/database/models"
	"backend/middlewares"
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
		OwnerAddr:    middlewares.GetWalletAddr(c),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vote created"})
}

func PageQueryVotes(c *gin.Context) {
	var request struct {
		Owner    string `json:"owner"`
		Page     int    `json:"page"`
		PageSize int    `json:"page_size"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if request.Page <= 0 || request.PageSize <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page or page_size"})
		return
	}

	votes, err := models.PageQueryVotes(database.Db, request.Page, request.PageSize, request.Owner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// count page
	count, err := models.CountVotes(database.Db, request.Owner)
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

func PageQueryMyVotes(c *gin.Context) {
	var request struct {
		Page     int `json:"page"`
		PageSize int `json:"page_size"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// get user wallet
	userWallet := middlewares.GetWalletAddr(c)
	tokens, err := vote.GetUserRelatedListFromBlockchain(c, userWallet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// reverse list
	for i, j := 0, len(tokens)-1; i < j; i, j = i+1, j-1 {
		tokens[i], tokens[j] = tokens[j], tokens[i]
	}
	cnt := len(tokens)
	// cut from list by page and page_size
	start := (request.Page - 1) * request.PageSize
	end := request.Page * request.PageSize
	if start >= len(tokens) {
		c.JSON(http.StatusOK, gin.H{
			"votes":       []interface{}{},
			"count":       len(tokens),
			"page":        request.Page,
			"page_size":   request.PageSize,
			"total_pages": (int64(len(tokens)) + int64(request.PageSize) - 1) / int64(request.PageSize),
		})
		return
	}
	if end > len(tokens) {
		end = len(tokens)
	}
	tokens = tokens[start:end]

	// get vote info
	votes := make([]models.Vote, 0)
	for _, token := range tokens {
		v, err := models.GetVoteByContractAddr(database.Db, token.Metadata.VotingContract.Hex())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		votes = append(votes, *v)
	}

	c.JSON(http.StatusOK, gin.H{
		"votes":       votes,
		"count":       cnt,
		"page":        request.Page,
		"page_size":   request.PageSize,
		"total_pages": (int64(cnt) + int64(request.PageSize) - 1) / int64(request.PageSize),
	})
}
