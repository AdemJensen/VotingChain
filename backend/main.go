package main

import (
	"backend/config"
	"backend/database/models"
	"backend/middlewares"
	"backend/routers"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"time"
)

func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.G.Server.CORSHost}, // 允许前端的 URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour, // 12小时内不需要重复请求 CORS
	}))

	// System Initialization
	r.GET("/init", routers.CheckInitStatus)          // Check if the system is initialized
	r.POST("/init-build", routers.GetInitContractTx) // Get the transaction to deploy NFT contract
	r.POST("/init-exec", routers.InitRootUser)       // Execute the transaction to deploy NFT contract

	// Auth
	r.GET("/auth/state", routers.GetUserState)                                               // Get current user state
	r.POST("/auth/info", routers.BatchGetUserInfo)                                           // Get user info by wallet address
	r.POST("/auth/gen", routers.GenAuthChallenge)                                            // Generate a challenge for user to sign
	r.POST("/auth/verify", routers.VerifyAuthChallenge)                                      // Verify the signature and generate JWT token
	r.POST("/auth/register", middlewares.RequireRole(models.RoleVoid), routers.RegisterUser) // Create an account for specified wallet address
	r.POST("/auth/update", middlewares.RequireRole(models.RoleUser), routers.UpdateUserInfo) // Update user info

	// Role
	r.GET("/admin/list", middlewares.RequireRole(models.RoleRoot), routers.GetAdminList)              // Get the list of admins
	r.POST("/admin/sync", middlewares.RequireRole(models.RoleRoot), routers.SyncAdminList)            // Sync admin list
	r.POST("/admin/add-build", middlewares.RequireRole(models.RoleRoot), routers.GenAddAdminTx)       // Add admin gen contract
	r.POST("/admin/add-exec", middlewares.RequireRole(models.RoleRoot), routers.AddAdmin)             // Add admin to db
	r.POST("/admin/remove-build", middlewares.RequireRole(models.RoleRoot), routers.GenRemoveAdminTx) // Remove admin gen contract
	r.POST("/admin/remove-exec", middlewares.RequireRole(models.RoleRoot), routers.RemoveAdmin)       // Remove admin to db

	r.POST("/createVoting", routers.CreateVoting) // 创建投票（部署 Voting 合约）

	// 其他 API（稍后实现）
	//r.POST("/authenticate", authenticateUser)
	//r.POST("/register", registerUser)
	//r.GET("/votings", listVotings)
	//r.GET("/user", getUserInfo)
	//r.GET("/user/votings", getUserVotingHistory)

	fmt.Println("Server started at http://localhost:8080")
	err := r.Run(fmt.Sprintf(":%d", config.G.Server.Port)) // 运行 HTTP 服务器
	if err != nil {
		fmt.Println("Err occurred when running server:", err)
	}
}
