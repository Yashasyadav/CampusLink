# CampusLink AI — API Conventions & Specifications

## Base URL & Versioning
All backend API routes are versioned under `/api/v1`.

## Standard Response Structure

Every successful response adheres to a predictable structure:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-09-05T21:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Handling

Errors return standard JSON response schemas:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested entity was not found.",
    "details": []
  }
}
```

## Health Endpoint
`GET /health` returns:
```json
{
  "status": "ok"
}
```
