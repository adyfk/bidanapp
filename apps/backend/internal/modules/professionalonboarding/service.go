package professionalonboarding

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"bidanapp/apps/backend/internal/modules/platformregistry"
	"bidanapp/apps/backend/internal/modules/adminauth"
	"bidanapp/apps/backend/internal/modules/viewerauth"
	"bidanapp/apps/backend/internal/platform/web"
)

var (
	ErrDatabaseUnavailable = errors.New("professional onboarding requires a database connection")
	ErrDocumentNotFound    = errors.New("professional document not found")
	ErrInvalidPayload      = errors.New("invalid professional onboarding payload")
	ErrMissingProfileName  = errors.New("professional storefront name is required")
)

type Service struct {
	db          *sql.DB
	platforms   *platformregistry.Service
	storageRoot string
}

func NewService(db *sql.DB, platforms *platformregistry.Service, storageRoot string) *Service {
	return &Service{
		db:          db,
		platforms:   platforms,
		storageRoot: storageRoot,
	}
}

func (s *Service) Workspace(ctx context.Context, platformID string, userID string) (ProfessionalPlatformWorkspace, error) {
	if s.db == nil {
		return ProfessionalPlatformWorkspace{}, ErrDatabaseUnavailable
	}

	platform, err := s.platforms.PlatformByID(ctx, platformID)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}
	schema, err := s.platforms.ActiveSchemaByPlatformID(ctx, platformID)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	workspace := ProfessionalPlatformWorkspace{
		Platform: platform,
		Schema:   schema,
	}

	var profile ProfessionalPlatformProfile
	var profileAttributes []byte
	var profileUpdatedAt time.Time
	err = s.db.QueryRowContext(ctx, `
		SELECT id, display_name, city, slug, status, review_status, attributes, updated_at
		FROM professional_platform_profiles
		WHERE platform_id = $1 AND user_id = $2
	`, platformID, userID).Scan(
		&profile.ID,
		&profile.DisplayName,
		&profile.City,
		&profile.Slug,
		&profile.Status,
		&profile.ReviewStatus,
		&profileAttributes,
		&profileUpdatedAt,
	)
	if err == nil {
		profile.PlatformID = platformID
		profile.UserID = userID
		profile.UpdatedAt = toRFC3339(profileUpdatedAt)
		if err := json.Unmarshal(profileAttributes, &profile.Attributes); err != nil {
			return ProfessionalPlatformWorkspace{}, err
		}
		workspace.Profile = &profile
	} else if !errors.Is(err, sql.ErrNoRows) {
		return ProfessionalPlatformWorkspace{}, err
	}

	var application ProfessionalPlatformApplication
	var applicationAttributes []byte
	var submittedAt sql.NullTime
	err = s.db.QueryRowContext(ctx, `
		SELECT id, status, review_notes, submitted_at, attributes
		FROM professional_applications
		WHERE platform_id = $1 AND user_id = $2
	`, platformID, userID).Scan(
		&application.ID,
		&application.Status,
		&application.ReviewNotes,
		&submittedAt,
		&applicationAttributes,
	)
	if err == nil {
		application.PlatformID = platformID
		application.UserID = userID
		if submittedAt.Valid {
			application.SubmittedAt = toRFC3339(submittedAt.Time)
		}
		if err := json.Unmarshal(applicationAttributes, &application.Attributes); err != nil {
			return ProfessionalPlatformWorkspace{}, err
		}
		application.Documents, err = s.loadDocuments(ctx, application.ID)
		if err != nil {
			return ProfessionalPlatformWorkspace{}, err
		}
		workspace.Application = &application
	} else if !errors.Is(err, sql.ErrNoRows) {
		return ProfessionalPlatformWorkspace{}, err
	}

	return workspace, nil
}

func (s *Service) UpsertWorkspace(
	ctx context.Context,
	platformID string,
	userID string,
	input UpsertProfessionalPlatformApplicationRequest,
) (ProfessionalPlatformWorkspace, error) {
	if s.db == nil {
		return ProfessionalPlatformWorkspace{}, ErrDatabaseUnavailable
	}

	schema, err := s.platforms.ActiveSchemaByPlatformID(ctx, platformID)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}
	if err := validateAttributes(schema, input.Attributes); err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	displayName := strings.TrimSpace(input.DisplayName)
	if displayName == "" {
		return ProfessionalPlatformWorkspace{}, ErrMissingProfileName
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	attributesJSON, err := json.Marshal(input.Attributes)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	slug := strings.TrimSpace(input.Slug)
	if slug == "" {
		slug = slugify(displayName, userID)
	} else {
		slug = slugify(slug, userID)
	}

	profileID, err := upsertProfile(ctx, tx, platformID, userID, slug, displayName, strings.TrimSpace(input.City), attributesJSON)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	var activeSchemaID string
	err = tx.QueryRowContext(ctx, `
		SELECT id
		FROM professional_attribute_schemas
		WHERE platform_id = $1 AND is_active = true
		ORDER BY version DESC
		LIMIT 1
	`, platformID).Scan(&activeSchemaID)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	applicationID, err := upsertApplication(ctx, tx, platformID, userID, profileID, activeSchemaID, attributesJSON)
	if err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	if err := syncDocuments(ctx, tx, applicationID, platformID, profileID, userID, schema, input.Attributes); err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	if err := tx.Commit(); err != nil {
		return ProfessionalPlatformWorkspace{}, err
	}

	return s.Workspace(ctx, platformID, userID)
}

func (s *Service) IssueDocumentUploadToken(
	ctx context.Context,
	platformID string,
	userID string,
	input IssueProfessionalDocumentUploadRequest,
) (ProfessionalDocumentUploadToken, error) {
	if s.db == nil {
		return ProfessionalDocumentUploadToken{}, ErrDatabaseUnavailable
	}
	if strings.TrimSpace(input.DocumentKey) == "" || strings.TrimSpace(input.FileName) == "" {
		return ProfessionalDocumentUploadToken{}, ErrInvalidPayload
	}
	if err := os.MkdirAll(s.resolvedStorageRoot(), 0o755); err != nil {
		return ProfessionalDocumentUploadToken{}, err
	}

	documentID, err := newID("pdoc_")
	if err != nil {
		return ProfessionalDocumentUploadToken{}, err
	}
	rawUploadToken, err := newID("putok_")
	if err != nil {
		return ProfessionalDocumentUploadToken{}, err
	}
	expiresAt := time.Now().UTC().Add(20 * time.Minute)
	fileName := safeFileName(input.FileName, input.DocumentKey)
	relativePath := filepath.Join(platformID, userID, documentID, fileName)
	storagePath := filepath.Join(s.resolvedStorageRoot(), relativePath)
	documentURL := "/api/v1/professional-documents/" + documentID
	metadataJSON, err := json.Marshal(map[string]any{
		"contentType":         strings.TrimSpace(input.ContentType),
		"originalFileName":    fileName,
		"storagePath":         storagePath,
		"uploadTokenExpiresAt": expiresAt.Format(time.RFC3339),
		"uploadTokenHash":     hashUploadToken(rawUploadToken),
		"uploaded":            false,
	})
	if err != nil {
		return ProfessionalDocumentUploadToken{}, err
	}

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO professional_documents (
			id, platform_id, profile_id, application_id, user_id, document_key, file_name, document_url, metadata, created_at
		) VALUES ($1, $2, NULL, NULL, $3, $4, $5, $6, $7, now())
	`, documentID, platformID, userID, strings.TrimSpace(input.DocumentKey), fileName, documentURL, metadataJSON)
	if err != nil {
		return ProfessionalDocumentUploadToken{}, err
	}

	return ProfessionalDocumentUploadToken{
		DocumentID:  documentID,
		DocumentURL: documentURL,
		ExpiresAt:   expiresAt.Format(time.RFC3339),
		Method:      http.MethodPut,
		UploadURL:   "/api/v1/uploads/professional-documents/" + documentID + "?token=" + rawUploadToken,
	}, nil
}

func (s *Service) HandleDocumentUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		web.WriteError(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	documentID := r.PathValue("document_id")
	rawToken := r.URL.Query().Get("token")
	if strings.TrimSpace(documentID) == "" || strings.TrimSpace(rawToken) == "" {
		web.WriteError(w, http.StatusBadRequest, "invalid_upload_token", "invalid upload token")
		return
	}

	ctx := r.Context()
	var platformID string
	var userID string
	var metadataJSON []byte
	var fileName string
	err := s.db.QueryRowContext(ctx, `
		SELECT platform_id, user_id, file_name, metadata
		FROM professional_documents
		WHERE id = $1
	`, documentID).Scan(&platformID, &userID, &fileName, &metadataJSON)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			web.WriteError(w, http.StatusNotFound, "professional_document_not_found", "professional document not found")
			return
		}
		web.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	metadata := map[string]any{}
	_ = json.Unmarshal(metadataJSON, &metadata)
	if metadata["uploadTokenHash"] != hashUploadToken(rawToken) {
		web.WriteError(w, http.StatusBadRequest, "invalid_upload_token", "invalid upload token")
		return
	}
	expiresAtRaw, _ := metadata["uploadTokenExpiresAt"].(string)
	expiresAt, _ := time.Parse(time.RFC3339, expiresAtRaw)
	if expiresAt.IsZero() || time.Now().UTC().After(expiresAt) {
		web.WriteError(w, http.StatusBadRequest, "upload_token_expired", "upload token expired")
		return
	}
	storagePath, _ := metadata["storagePath"].(string)
	if strings.TrimSpace(storagePath) == "" {
		web.WriteError(w, http.StatusInternalServerError, "invalid_storage_path", "invalid storage path")
		return
	}
	if err := os.MkdirAll(filepath.Dir(storagePath), 0o755); err != nil {
		web.WriteError(w, http.StatusInternalServerError, "storage_write_failed", "failed to prepare storage path")
		return
	}

	file, err := os.Create(storagePath)
	if err != nil {
		web.WriteError(w, http.StatusInternalServerError, "storage_write_failed", "failed to create storage file")
		return
	}
	defer file.Close()

	written, err := io.Copy(file, r.Body)
	if err != nil {
		web.WriteError(w, http.StatusInternalServerError, "storage_write_failed", "failed to write upload")
		return
	}

	metadata["fileSize"] = written
	metadata["uploaded"] = true
	metadata["uploadedAt"] = time.Now().UTC().Format(time.RFC3339)
	delete(metadata, "uploadTokenHash")
	delete(metadata, "uploadTokenExpiresAt")
	updatedMetadataJSON, err := json.Marshal(metadata)
	if err != nil {
		web.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	_, err = s.db.ExecContext(ctx, `
		UPDATE professional_documents
		SET metadata = $2,
		    file_name = $3,
		    document_url = $4
		WHERE id = $1
		  AND platform_id = $5
		  AND user_id = $6
	`, documentID, updatedMetadataJSON, fileName, "/api/v1/professional-documents/"+documentID, platformID, userID)
	if err != nil {
		web.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]any{
		"data": map[string]any{
			"documentId": documentID,
			"uploaded":   true,
		},
	})
}

func (s *Service) HandleDocumentDownload(w http.ResponseWriter, r *http.Request) {
	documentID := r.PathValue("document_id")
	if strings.TrimSpace(documentID) == "" {
		web.WriteError(w, http.StatusBadRequest, "professional_document_not_found", "professional document not found")
		return
	}

	ctx := r.Context()
	var ownerUserID string
	var fileName string
	var metadataJSON []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT user_id, file_name, metadata
		FROM professional_documents
		WHERE id = $1
	`, documentID).Scan(&ownerUserID, &fileName, &metadataJSON)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			web.WriteError(w, http.StatusNotFound, "professional_document_not_found", "professional document not found")
			return
		}
		web.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	adminSession, adminOK := adminauth.ContextSession(ctx)
	viewerSession, viewerOK := viewerauth.ContextSession(ctx)
	if !adminOK && (!viewerOK || viewerSession.Session.UserID != ownerUserID) {
		web.WriteError(w, http.StatusUnauthorized, "document_access_denied", "document access denied")
		return
	}
	_ = adminSession

	metadata := map[string]any{}
	_ = json.Unmarshal(metadataJSON, &metadata)
	storagePath, _ := metadata["storagePath"].(string)
	if strings.TrimSpace(storagePath) == "" {
		web.WriteError(w, http.StatusNotFound, "professional_document_not_found", "professional document not found")
		return
	}
	contentType, _ := metadata["contentType"].(string)
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	bytes, err := os.ReadFile(storagePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			web.WriteError(w, http.StatusNotFound, "professional_document_not_found", "professional document not found")
			return
		}
		web.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%q", fileName))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(bytes)
}

func validateAttributes(schema platformregistry.PlatformProfessionalSchema, attributes map[string]any) error {
	if attributes == nil {
		attributes = map[string]any{}
	}

	for _, field := range schema.Fields {
		if !field.Required {
			continue
		}

		value, exists := attributes[field.Key]
		if !exists || value == nil {
			return fmt.Errorf("%w: missing %s", ErrInvalidPayload, field.Key)
		}

		switch field.Type {
		case "boolean":
			if _, ok := value.(bool); !ok {
				return fmt.Errorf("%w: %s must be a boolean", ErrInvalidPayload, field.Key)
			}
		default:
			if strings.TrimSpace(fmt.Sprintf("%v", value)) == "" {
				return fmt.Errorf("%w: %s is required", ErrInvalidPayload, field.Key)
			}
		}
	}

	return nil
}

func slugify(value string, fallback string) string {
	slug := strings.ToLower(strings.TrimSpace(value))
	slug = strings.ReplaceAll(slug, "_", "-")
	slug = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '-':
			return r
		default:
			return '-'
		}
	}, slug)
	slug = strings.Trim(strings.Join(strings.FieldsFunc(slug, func(r rune) bool { return r == '-' }), "-"), "-")
	if slug == "" {
		return "professional-" + fallback
	}
	return slug
}

func newID(prefix string) (string, error) {
	buffer := make([]byte, 8)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return prefix + hex.EncodeToString(buffer), nil
}

func toRFC3339(value time.Time) string {
	if value.IsZero() {
		return ""
	}
	return value.UTC().Format(time.RFC3339)
}

func upsertProfile(
	ctx context.Context,
	tx *sql.Tx,
	platformID string,
	userID string,
	slug string,
	displayName string,
	city string,
	attributesJSON []byte,
) (string, error) {
	profileID, err := newID("pprof_")
	if err != nil {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, `
		INSERT INTO professional_platform_profiles (
			id,
			platform_id,
			user_id,
			slug,
			display_name,
			city,
			status,
			review_status,
			attributes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, 'pending_review', 'submitted', $7, now(), now())
		ON CONFLICT (platform_id, user_id) DO UPDATE SET
			slug = EXCLUDED.slug,
			display_name = EXCLUDED.display_name,
			city = EXCLUDED.city,
			status = 'pending_review',
			review_status = 'submitted',
			attributes = EXCLUDED.attributes,
			updated_at = now()
		RETURNING id
	`, profileID, platformID, userID, slug, displayName, city, attributesJSON).Scan(&id)
	return id, err
}

func upsertApplication(
	ctx context.Context,
	tx *sql.Tx,
	platformID string,
	userID string,
	profileID string,
	schemaID string,
	attributesJSON []byte,
) (string, error) {
	applicationID, err := newID("papp_")
	if err != nil {
		return "", err
	}

	var id string
	err = tx.QueryRowContext(ctx, `
		INSERT INTO professional_applications (
			id,
			platform_id,
			profile_id,
			user_id,
			schema_id,
			status,
			attributes,
			submitted_at,
			review_notes,
			created_at,
			updated_at
		) VALUES ($1, $2, $3, $4, $5, 'submitted', $6, now(), '', now(), now())
		ON CONFLICT (platform_id, user_id) DO UPDATE SET
			profile_id = EXCLUDED.profile_id,
			schema_id = EXCLUDED.schema_id,
			status = 'submitted',
			attributes = EXCLUDED.attributes,
			submitted_at = now(),
			review_notes = '',
			updated_at = now()
		RETURNING id
	`, applicationID, platformID, profileID, userID, schemaID, attributesJSON).Scan(&id)
	return id, err
}

func syncDocuments(
	ctx context.Context,
	tx *sql.Tx,
	applicationID string,
	platformID string,
	profileID string,
	userID string,
	schema platformregistry.PlatformProfessionalSchema,
	attributes map[string]any,
) error {
	referenced := map[string]struct{}{}

	for _, field := range schema.Fields {
		if field.Type != "document" {
			continue
		}
		value, ok := attributes[field.Key]
		if !ok {
			continue
		}

		documentID := strings.TrimSpace(fmt.Sprintf("%v", value))
		if documentID == "" {
			continue
		}
		referenced[documentID] = struct{}{}

		metadataJSON, err := json.Marshal(map[string]any{
			"fieldLabel": field.Label,
			"fieldType":  field.Type,
		})
		if err != nil {
			return err
		}

		result, err := tx.ExecContext(ctx, `
			UPDATE professional_documents
			SET profile_id = $2,
			    application_id = $3,
			    document_key = $4,
			    metadata = $5,
			    created_at = created_at
			WHERE id = $1
			  AND platform_id = $6
			  AND user_id = $7
		`, documentID, profileID, applicationID, field.Key, metadataJSON, platformID, userID)
		if err != nil {
			return err
		}
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return fmt.Errorf("%w: %s", ErrDocumentNotFound, documentID)
		}
	}

	rows, err := tx.QueryContext(ctx, `
		SELECT id
		FROM professional_documents
		WHERE application_id = $1
	`, applicationID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var staleIDs []string
	for rows.Next() {
		var documentID string
		if err := rows.Scan(&documentID); err != nil {
			return err
		}
		if _, ok := referenced[documentID]; !ok {
			staleIDs = append(staleIDs, documentID)
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for _, staleID := range staleIDs {
		if _, err := tx.ExecContext(ctx, `DELETE FROM professional_documents WHERE id = $1`, staleID); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) loadDocuments(ctx context.Context, applicationID string) ([]ProfessionalPlatformDocument, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, document_key, file_name, document_url, metadata
		FROM professional_documents
		WHERE application_id = $1
		ORDER BY document_key ASC, created_at DESC
	`, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	documents := make([]ProfessionalPlatformDocument, 0)
	for rows.Next() {
		var document ProfessionalPlatformDocument
		var metadataJSON []byte
		if err := rows.Scan(&document.ID, &document.DocumentKey, &document.FileName, &document.DocumentURL, &metadataJSON); err != nil {
			return nil, err
		}
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &document.Metadata); err != nil {
				return nil, err
			}
		}
		documents = append(documents, document)
	}
	return documents, rows.Err()
}

func fileNameFromURL(raw string, fallback string) string {
	parsed, err := url.Parse(raw)
	if err != nil {
		return fallback
	}
	name := strings.TrimSpace(path.Base(parsed.Path))
	if name == "." || name == "/" || name == "" {
		return fallback
	}
	return name
}

func (s *Service) resolvedStorageRoot() string {
	if strings.TrimSpace(s.storageRoot) != "" {
		return s.storageRoot
	}
	return filepath.Join(os.TempDir(), "bidanapp-assets")
}

func safeFileName(raw string, fallback string) string {
	name := strings.TrimSpace(filepath.Base(raw))
	if name == "." || name == "/" || name == "" {
		name = fallback
	}
	return strings.ReplaceAll(name, "..", "")
}

func hashUploadToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
