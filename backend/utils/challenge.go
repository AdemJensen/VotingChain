package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/pkg/errors"
	"log"
	"strings"
)

func GenerateChallenge() string {
	// 生成一个随机挑战字符串
	challengeBytes := make([]byte, 32)
	_, _ = rand.Read(challengeBytes)
	challenge := hex.EncodeToString(challengeBytes)
	return challenge
}

func VerifyChallenge(challenge, signature, walletAddr string) error {
	// 将公钥转换为钱包地址
	recoveredAddr, err := recoverAddress(challenge, signature)
	if err != nil {
		return errors.Wrapf(err, "recover address failed")
	}
	// 比对钱包地址
	if !strings.EqualFold(recoveredAddr.Hex()[2:], walletAddr) {
		log.Printf("Recovered address: %s, wallet address: %s", recoveredAddr.Hex(), walletAddr)
		return errors.New("signature verification failed")
	}
	return nil
}

func recoverAddress(message, signature string) (common.Address, error) {
	// 计算消息的 Keccak-256 哈希（符合以太坊签名标准）
	messageHash := crypto.Keccak256Hash([]byte("\x19Ethereum Signed Message:\n" + fmt.Sprint(len(message)) + message))

	// 解码签名
	signatureBytes, err := hex.DecodeString(strings.TrimPrefix(signature, "0x"))
	if err != nil {
		return common.Address{}, errors.New("签名格式错误")
	}

	// 以太坊签名的 `v` 值需要特殊处理
	if len(signatureBytes) != 65 {
		return common.Address{}, errors.New("签名长度错误")
	}
	signatureBytes[64] -= 27 // 兼容 v=27/28 的旧版 MetaMask

	// 从签名恢复公钥
	pubKey, err := crypto.SigToPub(messageHash.Bytes(), signatureBytes)
	if err != nil {
		return common.Address{}, errors.New("恢复公钥失败")
	}

	// 将公钥转换为钱包地址
	return crypto.PubkeyToAddress(*pubKey), nil
}
