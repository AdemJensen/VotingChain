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

func CreateAddAdminTx(ctx context.Context, executorWalletAddr, targetWalletAddr string) (*types.Transaction, error) {
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
		"addAdmin",
		common.HexToAddress(targetWalletAddr),
	)
	if err != nil {
		return nil, errors.Wrapf(err, "Create contract method call tx err")
	}

	return tx, nil
}

func IsAdminByBlockchain(ctx context.Context, walletAddr string) (bool, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		return false, errors.Wrapf(err, "New client err")
	}

	var isAdmin bool
	err = utils.CallViewMethod(
		ctx,
		client,
		utils.ContractVotingNFT,
		config.G.Blockchain.NFTContractAddr,
		"isAdministrator",
		[]interface{}{common.HexToAddress(walletAddr)},
		&isAdmin,
	)
	if err != nil {
		return false, errors.Wrapf(err, "Call contract method 'isAdministrator' err")
	}

	return isAdmin, nil
}

func AddAdminToDb(ctx context.Context, walletAddr string) error {
	// check if the wallet address is already an admin
	isAdmin, err := IsAdminByBlockchain(ctx, walletAddr)
	if err != nil {
		return errors.Wrapf(err, "Check if admin by blockchain err")
	}

	if !isAdmin {
		return errors.New("Wallet address is not an admin from blockchain data")
	}

	// add admin to db
	err = models.SetUserRoleByWalletAddr(database.Db, walletAddr, models.RoleAdmin)
	if err != nil {
		return errors.Wrapf(err, "Set user role by wallet address in DB err")
	}

	return nil
}
