package middlewares

import (
	"backend/database"
	"backend/database/models"
	"backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"net/http"
)

const KeyWalletAddr = "wallet_addr"

func GetWalletAddr(c *gin.Context) string {
	walletAddr, ok := c.Get(KeyWalletAddr)
	if !ok {
		return ""
	}
	return walletAddr.(string)
}

func DecodeWalletAddrFromHeader(c *gin.Context) (string, error) {
	token := c.GetHeader("Authorization")
	if token == "" || len(token) < 7 || token[:7] != "Bearer " {
		return "", errors.New("header empty or format invalid")
	}

	// Bearer token
	token = token[7:]

	walletAddr, err := utils.VerifyJWT(token)
	if err != nil {
		return "", errors.Wrap(err, "verify jwt failed")
	}

	return walletAddr, nil
}

// RequireRole 从请求头中获取钱包地址，并检查是否有权限
func RequireRole(role string) func(c *gin.Context) {
	return func(c *gin.Context) {
		walletAddr, err := DecodeWalletAddrFromHeader(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Decode token failed: " + err.Error()})
			c.Abort()
			return
		}

		// check role
		// 这里的逻辑是，如果接口显示不需要 role，那么只要是钱包地址有效即可访问，不需要该钱包在数据库中有记录，例如 register 接口
		// 如果接口需要 role，那么需要在数据库中有记录，并且有对应的 role
		if role != "" {
			hasRole, err := models.UserHasRole(database.Db, walletAddr, role)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check role: " + err.Error()})
				c.Abort()
				return
			}
			if !hasRole {
				c.JSON(http.StatusForbidden, gin.H{"error": "User does not have role: " + role})
				c.Abort()
				return
			}
		}

		c.Set(KeyWalletAddr, walletAddr)
		c.Next()
	}
}
