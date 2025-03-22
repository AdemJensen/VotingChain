package utils

import (
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/pkg/errors"
	"os"
	"strings"
)

const ContractVotingNFT = "VotingNFT_sol_VotingNFT"
const ContractVoting = "Voting_sol_Voting"

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
	client, err := NewEthClient()
	if err != nil {
		//log.Fatal("Failed to connect to Ethereum client:", err)
		return "", nil, errors.Wrapf(err, "New client err")
	}

	// 解析私钥
	key, err := crypto.HexToECDSA(privateKey)
	if err != nil {
		//log.Fatal("Invalid private key:", err)
		return "", nil, errors.Wrapf(err, "Invalid private key")
	}

	tx, err := CreateContractDeploymentTx(ctx, client, crypto.PubkeyToAddress(key.PublicKey).Hex(), contractName, params...)
	if err != nil {
		return "", nil, errors.Wrapf(err, "Failed to create contract deployment transaction")
	}

	// Get chain ID (Ganache default: 1337 or 5777)
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return "", nil, errors.Wrapf(err, "Error getting network ID")
	}

	// 签名交易
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), key)
	if err != nil {
		return "", nil, errors.Wrapf(err, "Failed to sign transaction")
	}

	// 发送交易
	txHash, contractAddr, err := ExecuteContractDeploymentTx(ctx, client, signedTx)
	if err != nil {
		return "", nil, errors.Wrapf(err, "Failed to execute contract deployment transaction")
	}

	fmt.Printf("Contract [%s] Deployed at: %s\n", contractName, contractAddr)
	fmt.Println("Transaction Hash:", txHash)

	return contractAddr[2:], tx, nil
}

func CallViewMethod[T any](
	ctx context.Context,
	client *ethclient.Client,
	contractName string,
	contractAddr string,
	funcName string,
	params []interface{},
	out *T,
) error {
	// 1. 解析 ABI
	abiStr, _, err := LoadContract(contractName)
	if err != nil {
		return errors.Wrapf(err, "Failed to load contract")
	}

	parsedAbi, err := abi.JSON(strings.NewReader(abiStr))
	if err != nil {
		return fmt.Errorf("failed to parse ABI: %w", err)
	}

	// 2. 准备 call data
	input, err := parsedAbi.Pack(funcName, params...)
	if err != nil {
		return fmt.Errorf("failed to pack params: %w", err)
	}

	// 3. 构造调用消息
	to := common.HexToAddress(contractAddr)
	msg := ethereum.CallMsg{
		To:   &to,
		Data: input,
	}

	// 4. 调用链上（eth_call）
	output, err := client.CallContract(ctx, msg, nil)
	if err != nil {
		return fmt.Errorf("failed to invoke contract: %w", err)
	}

	// 5. 解析返回值
	err = parsedAbi.UnpackIntoInterface(out, funcName, output)
	if err != nil {
		return fmt.Errorf("failed to unpack return values: %w", err)
	}

	return nil
}
