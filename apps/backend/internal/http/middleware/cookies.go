package middleware

import "net/http"

func readCookieValue(r *http.Request, cookieName string) string {
	if r == nil || cookieName == "" {
		return ""
	}

	cookie, err := r.Cookie(cookieName)
	if err != nil {
		return ""
	}

	return cookie.Value
}
