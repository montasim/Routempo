const catalog = {
  JSON_REQUIRED: [400, "Content-Type application/json is required"],
  CATEGORY_NOT_FOUND: [422, "The selected category does not exist"],
  INVALID_DATE_RANGE: [422, "End date must not precede start date"],
  DATE_RANGE_TOO_LARGE: [422, "Occurrence ranges cannot exceed 93 days"],
  OCCURRENCE_NOT_FOUND: [404, "Occurrence not found"],
  OCCURRENCE_NOT_TODAY: [409, "Only today's occurrence can be changed"],
  OCCURRENCE_NOT_RESOLVED: [
    409,
    "Only a completed or skipped occurrence can be reverted",
  ],
  OCCURRENCE_ALREADY_RESOLVED: [
    409,
    "Revert the current outcome before changing it",
  ],
  INVALID_ROUTINE_PATCH: [422, "The combined routine schedule is invalid"],
  INVALID_REDIRECT_URI: [400, "The mobile redirect URI is not allowed"],
  PAST_START_DATE: [422, "Routines cannot be added to past days"],
  AUTH_PROVIDER_ERROR: [
    502,
    "The authentication provider could not complete the request",
  ],
  IDEMPOTENCY_KEY_INVALID: [
    400,
    "Idempotency-Key must contain 8 to 200 visible characters",
  ],
  IDEMPOTENCY_KEY_REUSED: [
    409,
    "The Idempotency-Key was already used for a different request",
  ],
  IDEMPOTENCY_IN_PROGRESS: [
    409,
    "A request with this Idempotency-Key is still in progress",
  ],
} as const

export type ApiErrorCode = keyof typeof catalog

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly detail: string

  constructor(code: ApiErrorCode, detail?: string) {
    const [status, defaultDetail] = catalog[code]
    super(detail ?? defaultDetail)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.detail = detail ?? defaultDetail
  }
}
