package tests

import (
	"backend/utils"
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"log"
	"testing"
)

func TestDeployContract2(t *testing.T) {
	ctx := context.Background()
	// Connect to Ganache
	client, err := ethclient.Dial("http://127.0.0.1:7545")
	if err != nil {
		log.Fatal("Error connecting to Ganache:", err)
	}

	// Load the private key of an account from Ganache
	privateKeyHex := "b500fc1e5a3b0fe14ff36b8137d978fc4a782e6f05276639a0b92ccafe2b4371" // Replace with your Ganache private key

	_, tx, err := utils.DeployContract(ctx, privateKeyHex, utils.ContractVoting,
		common.HexToAddress("0xefcbf39d3bf506bbe90b3f51265c457525e7a79d"), "Test vote", "testing", uint8(1), false, []string{"123", "456"})
	if err != nil {
		log.Fatal("Failed to deploy contract:", err)
	}

	// Wait for transaction receipt
	fmt.Println("Waiting for contract deployment...")
	receipt, err := bind.WaitMined(ctx, client, tx)
	if err != nil {
		log.Fatal("Transaction mining error:", err)
	}

	fmt.Println("Contract deployed at:", receipt.ContractAddress.Hex())
}
