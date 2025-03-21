package vote

import (
	"backend/utils"
	"context"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// DeployVoting 部署 Voting 合约
func DeployVoting(ctx context.Context, privateKey string, nftAddress string) (string, *types.Transaction, error) {
	return utils.DeployContract(ctx, privateKey, utils.ContractVoting, common.HexToAddress(nftAddress))
}
