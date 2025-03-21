package nft

import (
	"backend/config"
	"backend/database"
	"backend/database/models"
	"backend/utils"
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/log"
	"github.com/pkg/errors"
)

func getAdminListFromBlockchain(ctx context.Context) ([]common.Address, error) {
	client, err := utils.NewEthClient()
	if err != nil {
		return nil, errors.Wrapf(err, "New client err")
	}

	var res []common.Address
	err = utils.CallViewMethod(
		ctx,
		client,
		utils.ContractVotingNFT,
		config.G.Blockchain.NFTContractAddr,
		"getAllAdmins",
		[]interface{}{},
		&res,
	)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to call view method")
	}

	return res, nil
}

func GetAdminList(ctx context.Context) ([]*models.User, error) {
	// get admin list from blockchain
	res, err := getAdminListFromBlockchain(ctx)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to get admin list from blockchain")
	}

	var (
		users    []*models.User
		addrList []string
	)
	for _, addr := range res {
		addrStr := utils.NormalizeHex(addr.Hex())
		addrList = append(addrList, addrStr)
		user, err := models.GetUserByWalletAddr(database.Db, addrStr)
		if err != nil {
			log.Error(fmt.Sprintf("Failed to get user by wallet address: %s", addr.Hex()))
			log.Warn("Admin list needs to sync due to the failure of getting user by wallet address")
			continue
		}
		if user.Role != models.RoleAdmin && user.Role != models.RoleRoot {
			user.Role = models.RoleAdmin
			log.Warn("Admin list needs to sync because of the inconsistency of user role (%s)", user.WalletAddr)
		}
		users = append(users, user)
	}

	return users, nil
}

func SyncAdminList(ctx context.Context) error {
	// get admin list from blockchain
	res, err := getAdminListFromBlockchain(ctx)
	if err != nil {
		return errors.Wrapf(err, "Failed to get admin list from blockchain")
	}

	var addrList []string
	for _, addr := range res {
		addrList = append(addrList, utils.NormalizeHex(addr.Hex()))
	}

	err = models.SyncAdminListByWalletAddrList(database.Db, addrList)
	if err != nil {
		return errors.Wrapf(err, "Failed to sync admin list")
	}
	return nil
}
