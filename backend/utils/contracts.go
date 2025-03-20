package utils

import (
	"backend/config"
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/pkg/errors"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// LoadContract 读取 ABI & Bytecode
func LoadContract(filename string) (string, string, error) {
	abiFile, err := os.ReadFile(fmt.Sprintf("./contracts_build/%s.abi", filename))
	if err != nil {
		//log.Fatalf("Failed to read ABI file: %v", err)
		return "", "", errors.Wrapf(err, "Failed to read ABI file: %v", err)
	}

	binFile, err := os.ReadFile(fmt.Sprintf("./contracts_build/%s.bin", filename))
	if err != nil {
		//log.Fatalf("Failed to read BIN file: %v", err)
		return "", "", errors.Wrapf(err, "Failed to read BIN file: %v", err)
	}

	return string(abiFile), string(binFile), nil
}

func DeployContract(ctx context.Context, privateKey string, contractName string, params ...interface{}) (string, *types.Transaction, error) {
	client, err := ethclient.Dial(config.G.Blockchain.RPCHost)
	if err != nil {
		//log.Fatal("Failed to connect to Ethereum client:", err)
		return "", nil, errors.Wrapf(err, "Failed to connect to Ethereum client: %v", err)
	}

	// 解析私钥
	key, err := crypto.HexToECDSA(privateKey)
	if err != nil {
		//log.Fatal("Invalid private key:", err)
		return "", nil, errors.Wrapf(err, "Invalid private key: %v", err)
	}

	auth, err := bind.NewKeyedTransactorWithChainID(key, big.NewInt(config.G.Blockchain.ChainID)) // 替换你的 ChainID
	if err != nil {
		//log.Fatal("Failed to create authorized transactor:", err)
		return "", nil, errors.Wrapf(err, "Failed to create authorized transactor: %v", err)
	}

	// 读取 ABI 和 Bytecode
	contractABI, contractBIN, err := LoadContract(contractName)

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		//log.Fatal("Failed to parse ABI:", err)
		return "", nil, errors.Wrapf(err, "Failed to parse ABI")
	}

	// **设置 Gas 费用**
	auth.GasLimit = uint64(5000000) // 5,000,000 Gas，足够的费用
	auth.GasPrice, err = client.SuggestGasPrice(ctx)
	if err != nil {
		//log.Fatal("Failed to fetch gas price:", err)
		return "", nil, errors.Wrapf(err, "Failed to fetch gas price: %v", err)
	}

	// 部署合约
	address, tx, _, err := bind.DeployContract(auth, parsedABI, common.FromHex(contractBIN), client, params...)
	if err != nil {
		//log.Fatal("Failed to deploy contract:", err)
		return "", nil, errors.Wrapf(err, "Failed to deploy contract")
	}

	fmt.Printf("Contract [%s] Deployed at: %s\n", contractName, address.Hex())
	fmt.Println("Transaction Hash:", tx.Hash().Hex())

	return address.Hex()[2:], tx, nil
}

// DeployVotingNFT 部署 VotingNFT 合约
func DeployVotingNFT(ctx context.Context, privateKey string) (string, *types.Transaction, error) {
	return DeployContract(ctx, privateKey, "contracts_VotingNFT_sol_VotingNFT")
}

// DeployVoting 部署 Voting 合约
func DeployVoting(ctx context.Context, privateKey string, nftAddress string) (string, *types.Transaction, error) {
	return DeployContract(ctx, privateKey, "contracts_Voting_sol_Voting", common.HexToAddress(nftAddress))
}
