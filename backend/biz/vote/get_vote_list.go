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

type NftInfo struct {
	TokenId  *big.Int       `json:"tokenId"`
	Owner    common.Address `json:"owner"`
	Metadata NftTokenMeta   `json:"metadata"`
}

func GetUserRelatedListFromBlockchain(ctx context.Context, walletAddr string) ([]NftInfo, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		return nil, errors.Wrapf(err, "New client err")
	}

	var res []NftInfo
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
