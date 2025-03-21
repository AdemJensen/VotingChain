package routers

import (
	"backend/biz/nft"
	"backend/database"
	"backend/database/models"
	"backend/middlewares"
	"backend/utils"
	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-gonic/gin"
	"net/http"
)

func GetAdminList(c *gin.Context) {
	// get admin list from blockchain
	users, err := nft.GetAdminList(c)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "OK", "users": users})
}

func SyncAdminList(c *gin.Context) {
	// sync admin list from blockchain
	err := nft.SyncAdminList(c)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "OK"})
}

func GenAddAdminTx(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddress = utils.NormalizeHex(request.WalletAddress)

	exists, err := models.UserExists(database.Db, request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if target wallet address exists in DB: " + err.Error()})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Target wallet address does not exist in DB"})
		return
	}

	tx, err := nft.CreateAddAdminTx(c, middlewares.GetWalletAddr(c), request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create add admin transaction: " + err.Error()})
		return
	}

	str, err := utils.JsonifyTx(tx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stringify transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tx": str})
}

func AddAdmin(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
		TxHash        string `json:"tx_hash"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddress = utils.NormalizeHex(request.WalletAddress)
	request.TxHash = utils.NormalizeHex(request.TxHash)

	// wait for transaction to be mined
	client, err := utils.NewEthClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Ethereum client: " + err.Error()})
		return
	}
	_, err = utils.WaitForTransactionReceipt(client, common.HexToHash(request.TxHash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction receipt: " + err.Error()})
		return
	}

	err = nft.AddAdminToDb(c, request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}

func GenRemoveAdminTx(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddress = utils.NormalizeHex(request.WalletAddress)

	exists, err := models.UserExists(database.Db, request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if target wallet address exists in DB: " + err.Error()})
		return
	}
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Target wallet address does not exist in DB"})
		return
	}

	tx, err := nft.CreateRemoveAdminTx(c, middlewares.GetWalletAddr(c), request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create remove admin transaction: " + err.Error()})
		return
	}

	str, err := utils.JsonifyTx(tx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stringify transaction: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tx": str})
}

func RemoveAdmin(c *gin.Context) {
	var request struct {
		WalletAddress string `json:"wallet_address"`
		TxHash        string `json:"tx_hash"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	request.WalletAddress = utils.NormalizeHex(request.WalletAddress)
	request.TxHash = utils.NormalizeHex(request.TxHash)

	// wait for transaction to be mined
	client, err := utils.NewEthClient()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Ethereum client: " + err.Error()})
		return
	}
	_, err = utils.WaitForTransactionReceipt(client, common.HexToHash(request.TxHash))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transaction receipt: " + err.Error()})
		return
	}

	err = nft.RemoveAdminFromDb(c, request.WalletAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}
