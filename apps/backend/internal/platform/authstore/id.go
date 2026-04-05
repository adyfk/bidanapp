package authstore

import (
	"crypto/rand"
	"encoding/hex"
)

func NewUserID() (string, error) {
	buffer := make([]byte, 10)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return "usr_" + hex.EncodeToString(buffer), nil
}
