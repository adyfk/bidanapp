package web

import (
	"context"
	"net"
	"net/http"
	"strings"
)

type RequestMetadata struct {
	IPAddress string
	Method    string
	Path      string
	UserAgent string
}

type requestMetadataContextKey string

const requestMetadataKey requestMetadataContextKey = "request_metadata"

func WithRequestMetadata(ctx context.Context, metadata RequestMetadata) context.Context {
	return context.WithValue(ctx, requestMetadataKey, metadata)
}

func RequestMetadataFromContext(ctx context.Context) (RequestMetadata, bool) {
	metadata, ok := ctx.Value(requestMetadataKey).(RequestMetadata)
	return metadata, ok
}

func NewRequestMetadata(r *http.Request) RequestMetadata {
	if r == nil {
		return RequestMetadata{}
	}

	return RequestMetadata{
		IPAddress: requestIPAddress(r),
		Method:    strings.ToUpper(strings.TrimSpace(r.Method)),
		Path:      requestPath(r),
		UserAgent: strings.TrimSpace(r.UserAgent()),
	}
}

func requestIPAddress(r *http.Request) string {
	if r == nil {
		return ""
	}

	if forwarded := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}

	if host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr)); err == nil {
		return host
	}

	return strings.TrimSpace(r.RemoteAddr)
}

func requestPath(r *http.Request) string {
	if r == nil || r.URL == nil {
		return ""
	}

	path := strings.TrimSpace(r.URL.Path)
	if rawQuery := strings.TrimSpace(r.URL.RawQuery); rawQuery != "" {
		return path + "?" + rawQuery
	}

	return path
}
