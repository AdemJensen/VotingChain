package models

import (
	"backend/utils"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"log"
)

// Vote 结构体对应 votes 表
type Vote struct {
	ID           uint64 `gorm:"primaryKey" json:"id"`
	ContractAddr string `gorm:"type:VARCHAR(100);unique;not null" json:"contract_address"`
	CreateTime   int64  `gorm:"autoCreateTime" json:"create_time"`
}

// TableName 指定 User 结构体对应的表名
func (Vote) TableName() string {
	return "votes"
}

func InsertVote(db *gorm.DB, vote *Vote) error {
	vote.ContractAddr = utils.NormalizeHex(vote.ContractAddr)
	err := db.Create(vote).Error
	if err != nil {
		return errors.Wrapf(err, "failed to insert vote")
	}
	log.Printf("Inserted new vote: %v", vote)
	return nil
}

// PageQueryVotes 分页查询投票
// page 页码，从 1 开始
// pageSize 每页大小
func PageQueryVotes(db *gorm.DB, page, pageSize int) ([]Vote, error) {
	var votes []Vote
	// order by create time desc
	err := db.Order("create_time desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&votes).Error
	if err != nil {
		return nil, errors.Wrapf(err, "failed to query votes")
	}
	return votes, nil
}
