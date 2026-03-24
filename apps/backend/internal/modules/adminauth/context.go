package adminauth

import "context"

type contextKey string

const sessionContextKey contextKey = "admin_auth_session"

func WithSession(ctx context.Context, session AuthenticatedSession) context.Context {
	return context.WithValue(ctx, sessionContextKey, session)
}

func ContextSession(ctx context.Context) (AuthenticatedSession, bool) {
	session, ok := ctx.Value(sessionContextKey).(AuthenticatedSession)
	return session, ok
}
