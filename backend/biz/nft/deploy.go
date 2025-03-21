package nft

import (
	"backend/utils"
	"context"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/pkg/errors"
)

// CreateVotingNFTDeploymentTx 创建 VotingNFT 合约部署交易
func CreateVotingNFTDeploymentTx(ctx context.Context, ownerAddr string) (*types.Transaction, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		//log.Fatal("Failed to connect to Ethereum client:", err)
		return nil, errors.Wrapf(err, "New client err")
	}
	return utils.CreateContractDeploymentTx(ctx, client, ownerAddr, utils.ContractVotingNFT)
}
