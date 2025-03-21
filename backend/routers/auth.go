package routers

import (
	"backend/database"
	"backend/database/models"
	"backend/middlewares"
	"backend/utils"
	"github.com/gin-gonic/gin"
	"net/http"
)

var authChallenges = make(map[string]string)

// GetUserState 获取当前访问者的状态
// 如果用户已经注册，则返回 registered
// 如果用户未注册，则返回 verified
// 如果用户未验证（缺乏有效的 JWT Token），则返回 unverified
func GetUserState(c *gin.Context) {
	walletAddr, err := middlewares.DecodeWalletAddrFromHeader(c)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": models.StateUnverified})
		return
	}

	exists, err := models.UserExists(database.Db, walletAddr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check user: " + err.Error()})
		return
	}
	if exists {
		c.JSON(http.StatusOK, gin.H{"status": models.StateRegistered})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{"status": models.StateVerified})
		return
	}
}

type userInfo struct {
	WalletAddr string `json:"wallet_address"`
	Email      string `json:"email"`
	Nickname   string `json:"nickname"`
	Role       string `json:"role"`
	State      string `json:"state"`
	Err        string `json:"error"`
}

func BatchGetUserInfo(c *gin.Context) {
	var request struct {
		WalletAddresses []string `json:"wallet_addresses"`
		JWTTokens       []string `json:"jwt_tokens"` // 可选参数，如果传入，则必须与 wallet_addresses 一一对应
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if len(request.JWTTokens) > 0 {
		if len(request.WalletAddresses) != len(request.JWTTokens) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "wallet_addresses and jwt_tokens must have the same length"})
			return
		}
	}

	var res = make(map[string]*userInfo)
	for i := range request.WalletAddresses {
		walletAddr := utils.NormalizeHex(request.WalletAddresses[i])
		user, err := models.GetUserByWalletAddr(database.Db, walletAddr)
		if err != nil {
			res[walletAddr] = &userInfo{
				Role:       models.RoleVoid,
				WalletAddr: walletAddr,
				Err:        err.Error(),
			}
		} else {
			res[walletAddr] = &userInfo{
				Email:      user.Email,
				Nickname:   user.Nickname,
				Role:       user.Role,
				WalletAddr: user.WalletAddr,
				Err:        "",
			}
		}

		if len(request.JWTTokens) > 0 {
			_, err = utils.VerifyJWT(request.JWTTokens[i])
			if err != nil {
				res[walletAddr].Err = err.Error()
				res[walletAddr].State = models.StateUnverified
			} else {
				if res[walletAddr].Role == models.RoleVoid {
					res[walletAddr].State = models.StateVerified
				} else {
					res[walletAddr].State = models.StateRegistered
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"info": res})
}

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
