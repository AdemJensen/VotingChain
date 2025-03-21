package nft

import (
	"backend/config"
	"backend/database"
	"backend/database/models"
	"backend/utils"
	"context"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/pkg/errors"
)

func CreateRemoveAdminTx(ctx context.Context, executorWalletAddr, targetWalletAddr string) (*types.Transaction, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		return nil, errors.Wrapf(err, "New client err")
	}

	tx, err := utils.CreateContractMethodCallTx(
		ctx,
		client,
		executorWalletAddr,
		utils.ContractVotingNFT,
		config.G.Blockchain.NFTContractAddr,
		"removeAdmin",
		common.HexToAddress(targetWalletAddr),
	)
	if err != nil {
		return nil, errors.Wrapf(err, "Create contract method call tx err")
	}

	return tx, nil
}

func RemoveAdminFromDb(ctx context.Context, walletAddr string) error {
	// check if the wallet address is already an admin
	isAdmin, err := IsAdminByBlockchain(ctx, walletAddr)
	if err != nil {
		return errors.Wrapf(err, "Check if admin by blockchain err")
	}

	if isAdmin {
		return errors.New("Wallet address is an admin from blockchain data")
	}

	// add admin to db
	err = models.SetUserRoleByWalletAddr(database.Db, walletAddr, models.RoleUser)
	if err != nil {
		return errors.Wrapf(err, "Set user role by wallet address in DB err")
	}

	return nil
}
