package utils

import "strings"

func NormalizeHex(addr string) string {
	if strings.HasPrefix(addr, "0x") || strings.HasPrefix(addr, "0X") {
		addr = addr[2:]
	}
	addr = strings.ToLower(addr)
	return addr
}
