package vote

import (
	"backend/config"
	"backend/utils"
	"context"
	"github.com/ethereum/go-ethereum/common"
	"github.com/pkg/errors"
	"math/big"
)

type NftTokenMeta struct {
	VotingContract common.Address `json:"votingContract"`
	Role           string         `json:"role"`
	Option         *big.Int       `json:"option"`
}

func GetUserRelatedListFromBlockchain(ctx context.Context, walletAddr string) ([]NftTokenMeta, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		return nil, errors.Wrapf(err, "New client err")
	}

	var res []NftTokenMeta
	err = utils.CallViewMethod(
		ctx,
		client,
		utils.ContractVotingNFT,
		config.G.Blockchain.NFTContractAddr,
		"getAllTokensByUser",
		[]interface{}{common.HexToAddress(walletAddr)},
		&res,
	)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to call view method")
	}

	return res, nil
}
