package models

import (
	"backend/utils"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"log"
)

// User 结构体对应 users 表
type User struct {
	ID         uint64 `gorm:"primaryKey"`
	Email      string `gorm:"type:VARCHAR(50);unique;not null"`
	Nickname   string `gorm:"type:VARCHAR(255);not null"`
	Role       string `gorm:"type:VARCHAR(10);not null"`
	WalletAddr string `gorm:"type:VARCHAR(100);unique;not null"` // 钱包地址, 没有 0x 前缀
	CreateTime int64  `gorm:"autoCreateTime"`
}

const (
	RoleUser  = "user"
	RoleAdmin = "admin"
	RoleRoot  = "root"
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
