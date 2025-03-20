package main

import (
	"backend/config"
	"backend/routers"
	"fmt"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 用户认证
	r.POST("/init", routers.InitRootUser)         // 初始化 Root 用户（部署 NFT 合约）
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
