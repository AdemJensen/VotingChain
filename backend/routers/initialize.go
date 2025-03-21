package routers

import (
	"backend/biz/nft"
	"backend/config"
	"backend/database"
	"backend/database/models"
	"backend/utils"
	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
	"net/http"
)

func isInitialized() bool {
	return config.G.Blockchain.RootUserAddr != ""
}

func CheckInitStatus(c *gin.Context) {
	if !isInitialized() {
		c.String(http.StatusOK, "ni")
	} else {
		c.String(http.StatusOK, "i")
	}
}

func GetInitContractTx(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddress = utils.NormalizeHex(request.WalletAddress)

	if !isInitialized() {
		tx, err := nft.CreateVotingNFTDeploymentTx(c, request.WalletAddress)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deployment transaction: " + err.Error()})
			return
		}

		str, err := utils.JsonifyTx(tx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stringify transaction: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"tx": str})
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "System already initialized"})
	}
}

func InitRootUser(c *gin.Context) {
	var request struct {
		WalletAddr string `json:"wallet_address"`
		TxHash     string `json:"tx_hash"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddr = utils.NormalizeHex(request.WalletAddr)

	if !isInitialized() {
		client, err := utils.NewEthClient()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Ethereum client: " + err.Error()})
			return
		}

		// **等待交易上链，获取交易回执**
		receipt, err := utils.WaitForTransactionReceipt(client, common.HexToHash(request.TxHash))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction receipt: " + err.Error()})
			return
		}

		config.G.Blockchain.RootUserAddr = utils.NormalizeHex(request.WalletAddr)
		config.G.Blockchain.NFTContractAddr = utils.NormalizeHex(receipt.ContractAddress.Hex())
		config.SaveConfig()

		// migrate database
		err = database.Migrate()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to migrate database: " + err.Error()})
			return
		}

		// insert root user
		err = models.InsertUser(database.Db, &models.User{
			Email:      config.G.Blockchain.RootUserEmail,
			Nickname:   "root",
			Role:       models.RoleRoot,
			WalletAddr: request.WalletAddr,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert root user: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Sys init OK", "nft_contract": config.G.Blockchain.NFTContractAddr})
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "System already initialized"})
	}
}
