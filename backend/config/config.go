package config

import (
	"encoding/json"
	"github.com/pkg/errors"
	"os"
)

type Config struct {
	Server struct {
		Port        int    `json:"port"`
		CORSHost    string `json:"corsHost"`
		JWTSecret   string `json:"jwtSecret"`
		JWTExpireHr int    `json:"jwtExpireHr"` // in hours
		JWTKey      string `json:"jwtKey"`      // 你可以通过更换 key 使先前的 JWT Token 失效
	} `json:"server"`
	Db struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		User     string `json:"user"`
		Password string `json:"password"`
		Database string `json:"database"`
	} `json:"db"`
	Blockchain struct {
		RPCHost         string `json:"rpcHost"`
		ChainID         int64  `json:"chainID"`
		RootUserEmail   string `json:"rootUserEmail"`
		RootUserAddr    string `json:"rootUserAddr"`
		NFTContractAddr string `json:"nftContractAddr"`
	} `json:"blockchain"`
}

var G Config

func init() {
	err := readConfig()
	if err != nil {
		panic(err)
	}
}

// ReadConfig Read config file
func readConfig() error {
	file, err := os.ReadFile("./config.json")
	if err != nil {
		return errors.Wrapf(err, "Failed to read config file: %v", err)
	}

	err = json.Unmarshal(file, &G)
	if err != nil {
		return errors.Wrapf(err, "Failed to unmarshal config file: %v", err)
	}

	return nil
}

func SaveConfig() {
	file, _ := json.MarshalIndent(G, "", "  ")
	_ = os.WriteFile("./config.json", file, 0644)
}
