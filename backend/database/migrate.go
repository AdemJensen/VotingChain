package database

import (
	"backend/database/models"
	"github.com/pkg/errors"
)

func Migrate() error {
	// **初始化数据库**
	// 自动迁移（如果 users 表不存在则创建）
	err := Db.AutoMigrate(&models.User{})
	if err != nil {
		return errors.Wrapf(err, "Failed to migrate User model")
	}

	return nil
}
