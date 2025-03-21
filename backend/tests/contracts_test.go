package tests

import (
	"backend/utils"
	"context"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"log"
	"testing"
)

func TestCallViewMethod(t *testing.T) {
	ctx := context.Background()
	// Connect to Ganache
	client, err := ethclient.Dial("http://127.0.0.1:7545")
	if err != nil {
		log.Fatal("Error connecting to Ganache:", err)
	}

	var res bool
	res = false
	err = utils.CallViewMethod(
		ctx,
		client,
		"contracts_VotingNFT_sol_VotingNFT",
		"9faa9ce96f95b6859eaa14d7f0ec64f189ed3b66",
		"isAdministrator",
		[]interface{}{common.HexToAddress("155b9019c48f1d785936b62c6863b8aa128b458e")},
		&res,
	)
	if err != nil {
		t.Fatal(err)
	}
	t.Log(res)
}
