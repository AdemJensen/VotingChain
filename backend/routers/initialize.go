package routers

import (
	"backend/config"
	"backend/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

func InitRootUser(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
		PrivateKey    string `json:"private_key"` // 前端传递私钥
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if config.G.Blockchain.RootUserAddr == "" {
		contractAddr, _, err := utils.DeployVotingNFT(c, request.PrivateKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deploy NFT contract: " + err.Error()})
			return
		}
		config.G.Blockchain.RootUserAddr = request.WalletAddress
		config.G.Blockchain.NFTContractAddr = contractAddr
		config.SaveConfig()
		c.JSON(http.StatusOK, gin.H{"message": "Root user registered", "nft_contract": config.G.Blockchain.NFTContractAddr})
	} else {
		//c.JSON(http.StatusForbidden, gin.H{"error": "Root user already exists"})
		// return 404 to hide this page
		c.JSON(http.StatusNotFound, gin.H{"error": "Page not found"})
	}
}
