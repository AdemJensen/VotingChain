package models

import (
	"backend/utils"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"log"
)

// User 结构体对应 users 表
type User struct {
	ID         uint64 `gorm:"primaryKey" json:"id"`
	Email      string `gorm:"type:VARCHAR(50);unique;not null" json:"email"`
	Nickname   string `gorm:"type:VARCHAR(255);not null" json:"nickname"`
	Role       string `gorm:"type:VARCHAR(10);not null" json:"role"`
	WalletAddr string `gorm:"type:VARCHAR(100);unique;not null" json:"wallet_address"` // 钱包地址, 没有 0x 前缀
	CreateTime int64  `gorm:"autoCreateTime" json:"create_time"`
}

const (
	RoleVoid  = "" // void role means the wallet address is verified, but not registered. This value should not appear in the database.
	RoleUser  = "user"
	RoleAdmin = "admin"
	RoleRoot  = "root"
)

const (
	StateUnverified = "unverified" // 表示用户未登录或者 JWT Token 无效
	StateVerified   = "verified"   // 表示用户已拥有有效的 JWT Token，但未注册
	StateRegistered = "registered" // 表示用户已注册且拥有有效的 JWT Token
)

// TableName 指定 User 结构体对应的表名
func (User) TableName() string {
	return "users"
}

func InsertUser(db *gorm.DB, user *User) error {
	if user.Role == "" {
		user.Role = RoleUser
	}
	user.WalletAddr = utils.NormalizeHex(user.WalletAddr)
	err := db.Create(user).Error
	if err != nil {
		return errors.Wrapf(err, "failed to insert user")
	}
	log.Printf("Inserted new user: %v", user)
	return nil
}

func UserExists(db *gorm.DB, walletAddr string) (bool, error) {
	var count int64
	err := db.Model(&User{}).Where("wallet_addr = ?", walletAddr).Count(&count).Error
	if err != nil {
		return false, errors.Wrapf(err, "failed to query user")
	}
	return count > 0, nil
}

func GetUserByWalletAddr(db *gorm.DB, walletAddr string) (*User, error) {
	var user User
	err := db.Where("wallet_addr = ?", walletAddr).First(&user).Error
	if err != nil {
		return nil, errors.Wrapf(err, "failed to get user")
	}
	return &user, nil
}

func UserHasRole(db *gorm.DB, walletAddr, role string) (bool, error) {
	user, err := GetUserByWalletAddr(db, walletAddr)
	if err != nil {
		return false, err
	}
	switch user.Role {
	case RoleRoot:
		// root user has all roles
		return true, nil
	case RoleAdmin:
		// admin user has admin and user roles
		return role == RoleAdmin || role == RoleUser, nil
	case RoleUser:
		// normal user has only user role
		return role == RoleUser, nil
	default:
		return false, errors.Errorf("unknown user role '%s'", user.Role)
	}
}

func UpdateUserByWalletAddr(db *gorm.DB, walletAddr, nickname string) error {
	err := db.Model(&User{}).Where("wallet_addr = ?", walletAddr).Update("nickname", nickname).Error
	if err != nil {
		return errors.Wrapf(err, "failed to update user")
	}
	return nil
}

func SyncAdminListByWalletAddrList(db *gorm.DB, walletAddrList []string) error {
	// start transaction
	outerErr := db.Transaction(func(tx *gorm.DB) error {
		// remove all admin roles
		err := tx.Model(&User{}).Where("role = ?", RoleAdmin).Update("role", RoleUser).Error
		if err != nil {
			return errors.Wrapf(err, "failed to update user role")
		}

		// add admin roles
		for _, walletAddr := range walletAddrList {
			walletAddr = utils.NormalizeHex(walletAddr)
			err = tx.Model(&User{}).Where("wallet_addr = ? AND role != ?", walletAddr, RoleRoot).Update("role", RoleAdmin).Error
			if err != nil {
				return errors.Wrapf(err, "failed to update user role for user %s", walletAddr)
			}
		}

		return nil
	})

	if outerErr != nil {
		return errors.Wrapf(outerErr, "failed to sync admin list")
	}
	return nil
}

func SetUserRoleByWalletAddr(db *gorm.DB, walletAddr, role string) error {
	walletAddr = utils.NormalizeHex(walletAddr)
	err := db.Model(&User{}).Where("wallet_addr = ?", walletAddr).Update("role", role).Error
	if err != nil {
		return errors.Wrapf(err, "failed to set user role")
	}
	return nil
}
