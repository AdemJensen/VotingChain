package utils

import (
	"backend/config"
	"context"
	"encoding/hex"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/pkg/errors"
	"math/big"
	"strings"
	"time"
)

func NewEthClient() (*ethclient.Client, error) {
	client, err := ethclient.Dial(config.G.Blockchain.RPCHost)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to connect to Ethereum client: %v", err)
	}
	return client, nil
}

func CreateContractDeploymentTx(ctx context.Context, client *ethclient.Client, publicAddress, contractName string, params ...interface{}) (*types.Transaction, error) {
	nonce, err := client.PendingNonceAt(ctx, common.HexToAddress(publicAddress))
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to get nonce: %v", err)
	}

	// Set gas parameters
	gasLimit := uint64(5000000) // Gas limit
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to get gas price: %v", err)
	}

	contractABI, contractBIN, err := LoadContract(contractName)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to load contract %s", contractName)
	}

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		//log.Fatal("Failed to parse ABI:", err)
		return nil, errors.Wrapf(err, "Failed to parse ABI")
	}
	constructorArgs, err := parsedABI.Pack("", params...) // 传入 constructor 参数
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to pack constructor arguments")
	}
	finalBytecode := append(common.FromHex(contractBIN), constructorArgs...)

	tx := types.NewContractCreation(nonce, big.NewInt(0), gasLimit, gasPrice, finalBytecode)
	return tx, nil
}

func CreateContractMethodCallTx(
	ctx context.Context,
	client *ethclient.Client,
	publicAddress string,
	contractName string,
	contractAddress string,
	methodName string,
	params ...interface{},
) (*types.Transaction, error) {
	from := common.HexToAddress(publicAddress)
	to := common.HexToAddress(contractAddress)

	// 1. 获取 nonce
	nonce, err := client.PendingNonceAt(ctx, from)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get nonce")
	}

	// 2. 加载 ABI
	contractABI, _, err := LoadContract(contractName)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to load contract %s", contractName)
	}

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse ABI")
	}

	// 3. 打包函数调用数据
	data, err := parsedABI.Pack(methodName, params...)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to pack method %s", methodName)
	}

	// 4. 估算 gas
	msg := ethereum.CallMsg{
		From: from,
		To:   &to,
		Gas:  0,
		Data: data,
	}
	gasLimit, err := client.EstimateGas(ctx, msg)
	if err != nil {
		return nil, errors.Wrap(err, "failed to estimate gas")
	}

	// 5. 获取 gas price
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "failed to suggest gas price")
	}

	// 6. 构建交易对象（value = 0）
	tx := types.NewTransaction(nonce, to, big.NewInt(0), gasLimit, gasPrice, data)
	return tx, nil
}

func StringifyTx(tx *types.Transaction) (string, error) {
	str, err := tx.MarshalBinary()
	if err != nil {
		return "", errors.Wrapf(err, "Failed to stringify transaction")
	}
	return hex.EncodeToString(str), nil
}

func JsonifyTx(tx *types.Transaction) (string, error) {
	str, err := tx.MarshalJSON()
	if err != nil {
		return "", errors.Wrapf(err, "Failed to jsonify transaction")
	}
	return string(str), nil
}

func DecodeTx(txData string) (*types.Transaction, error) {
	txBytes, err := hex.DecodeString(txData)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to decode transaction data")
	}
	var tx types.Transaction
	err = tx.UnmarshalBinary(txBytes)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to unmarshal transaction data")
	}
	return &tx, nil
}

func ExecuteContractDeploymentTx(ctx context.Context, client *ethclient.Client, tx *types.Transaction) (string, string, error) {
	err := client.SendTransaction(ctx, tx)
	if err != nil {
		return "", "", errors.Wrapf(err, "Failed to send transaction: %v", err)
	}

	// 获取交易哈希
	txHash := tx.Hash()

	// **等待交易上链，获取交易回执**
	receipt, err := WaitForTransactionReceipt(client, txHash)
	if err != nil {
		return "", "", errors.Wrapf(err, "Failed to get transaction receipt")
	}

	// 解析合约地址（如果交易部署的是合约）
	contractAddress := receipt.ContractAddress.Hex()

	return tx.Hash().Hex(), contractAddress, nil
}

// WaitForTransactionReceipt 等待交易上链
func WaitForTransactionReceipt(client *ethclient.Client, txHash common.Hash) (*types.Receipt, error) {
	ctx := context.Background()
	for {
		receipt, err := client.TransactionReceipt(ctx, txHash)
		if err == nil {
			return receipt, nil
		}

		// 交易还未上链，等待 1 秒后重试
		if err.Error() == "not found" {
			time.Sleep(1 * time.Second)
			continue
		}

		return nil, err
	}
}
