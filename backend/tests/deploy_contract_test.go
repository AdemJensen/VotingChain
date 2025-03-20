package tests

import (
	"context"
	"encoding/hex"
	"fmt"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"io/ioutil"
	"log"
	"math/big"
	"strings"
	"testing"
)

func TestDeployContract(t *testing.T) {
	ctx := context.Background()
	// Connect to Ganache
	client, err := ethclient.Dial("http://127.0.0.1:7545")
	if err != nil {
		log.Fatal("Error connecting to Ganache:", err)
	}

	// Load the private key of an account from Ganache
	privateKeyHex := "b500fc1e5a3b0fe14ff36b8137d978fc4a782e6f05276639a0b92ccafe2b4371" // Replace with your Ganache private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		log.Fatal("Invalid private key:", err)
	}

	// Get public address from private key
	publicAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	fmt.Println("Deploying from address:", publicAddress.Hex())

	// Get nonce
	nonce, err := client.PendingNonceAt(ctx, publicAddress)
	if err != nil {
		log.Fatal(err)
	}

	// Get chain ID (Ganache default: 1337 or 5777)
	chainID, err := client.ChainID(ctx)
	if err != nil {
		log.Fatal("Error getting network ID:", err)
	}
	fmt.Println("Chain ID:", chainID) // Debugging purpose

	// Read compiled contract bytecode
	bytecode, err := ioutil.ReadFile("../contracts_build/contracts_test_sol_Test.bin")
	if err != nil {
		log.Fatal("Failed to read contract bytecode:", err)
	}

	// Trim spaces and newline characters
	bytecodeStr := strings.TrimSpace(string(bytecode))

	// Convert bytecode to hex
	contractData, err := hex.DecodeString(bytecodeStr)
	if err != nil {
		log.Fatal("Failed to decode contract bytecode:", err)
	}

	// Set gas parameters
	gasLimit := uint64(5000000) // Gas limit
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatal("Failed to get gas price:", err)
	}

	// Create transaction
	tx := types.NewContractCreation(nonce, big.NewInt(0), gasLimit, gasPrice, contractData)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		log.Fatal("Failed to sign transaction:", err)
	}

	// Send transaction
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatal("Failed to send transaction:", err)
	}

	fmt.Println("Transaction hash:", signedTx.Hash().Hex())

	// Wait for transaction receipt
	fmt.Println("Waiting for contract deployment...")
	receipt, err := bind.WaitMined(ctx, client, signedTx)
	if err != nil {
		log.Fatal("Transaction mining error:", err)
	}

	fmt.Println("Contract deployed at:", receipt.ContractAddress.Hex())
}
