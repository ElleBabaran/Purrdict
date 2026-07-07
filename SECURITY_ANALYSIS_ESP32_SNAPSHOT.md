# Security Analysis: ESP32 Snapshot API Endpoint

## Vulnerability Report Summary
**Title:** Unauthenticated snapshot API exposes the latest ESP32 camera frame to any origin  
**Endpoint:** `GET /api/esp32/snapshot`  
**File:** `src/app/api/esp32/snapshot/route.ts`  
**Severity:** High (Confidentiality breach, potential multi-tenant data leakage)

## Root Cause (As Reported)
The pentest identified that the endpoint:
1. Had no authentication or authorization checks
2. Returned image data from a global `latestSnapshot` variable or unscoped database query
3. Used `Access-Control-Allow-Origin: "*"` allowing cross-origin access
4. Did not filter by `owner_id`, `cat_id`, or device, returning the newest snapshot globally

## Current Security Posture (After Hardening)

### Authentication Layer (Lines 120-124)
```typescript
const userId = getUserId(request);
if (!userId) {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
```
- **Protection:** Requires valid JWT Bearer token in Authorization header
- **Implementation:** Uses `getUserId()` from `@/lib/auth` which:
  - Extracts Bearer token from Authorization header
  - Verifies JWT signature using server-side secret
  - Returns null for missing, invalid, or expired tokens
- **Result:** Unauthenticated requests are rejected with 401 before any processing

### Input Validation (Lines 127-133)
```typescript
const catId = searchParams.get("catId");
if (!catId) {
  return NextResponse.json({ error: "catId is required." }, { status: 400 });
}
```
- **Protection:** Requires explicit `catId` parameter
- **Purpose:** Prevents any ambiguity about which cat's snapshot is being requested
- **Result:** Requests without catId are rejected with 400

### Authorization Layer (Lines 141-150)
```typescript
const cat = await queryOne<{ id: string }>(
  "SELECT id FROM cats WHERE id = $1 AND owner_id = $2",
  [catId, userId]
);
if (!cat) {
  return NextResponse.json({ error: "Cat not found for this account." }, { status: 404 });
}
```
- **Protection:** Verifies the requested cat belongs to the authenticated user
- **SQL Query:** Uses parameterized query with both `id` AND `owner_id` conditions
- **Result:** Prevents horizontal privilege escalation - users cannot access other users' cats

### Data Scoping (Lines 152-161)
```typescript
const device = await queryOne<{ id: string; latest_snapshot: string | null; latest_snapshot_at: string | null }>(
  `SELECT id, latest_snapshot, latest_snapshot_at
   FROM esp32_devices
   WHERE cat_id = $1
   ORDER BY last_seen DESC NULLS LAST
   LIMIT 1`,
  [catId]
);
```
- **Protection:** Queries devices filtered by the verified `cat_id`
- **Scope:** Only returns devices paired to the user's cat (already verified in previous step)
- **Result:** No cross-tenant data leakage - each user only sees their own devices

### CORS Policy (Lines 215-220)
```typescript
// SECURITY: No "Access-Control-Allow-Origin: *" header is set here.
// This response carries a specific user's cat snapshot and is fetched same-origin
// from the dashboard with a Bearer token. A wildcard CORS header would allow
// any third-party site to read an authenticated user's private camera frame
// if it were ever fetched cross-origin with credentials. The absence of CORS
// headers ensures this endpoint can only be accessed by same-origin requests.
```
- **Protection:** No CORS headers are set on responses
- **Result:** Browser Same-Origin Policy prevents cross-origin JavaScript from reading responses
- **Note:** Even if CORS were enabled, authentication would still prevent unauthorized access

### In-Memory Cache Security (Lines 37-39, 158-161)
```typescript
const snapshotCache = new Map<string, SnapshotCacheEntry>();
// ...
const cached = snapshotCache.get(device.id);
```
- **Protection:** Cache is keyed by `device.id`, not globally
- **Scope:** Each device's snapshots are isolated
- **Result:** No cache poisoning or cross-device data leakage

## Security Controls Summary

| Control | Status | Implementation |
|---------|--------|----------------|
| Authentication | ✅ Enforced | JWT Bearer token required (line 120-124) |
| Authorization | ✅ Enforced | Owner verification via SQL (line 141-150) |
| Input Validation | ✅ Enforced | catId required (line 127-133) |
| Data Scoping | ✅ Enforced | Filtered by verified cat_id (line 152-161) |
| CORS Policy | ✅ Secure | No wildcard CORS headers (line 215-220) |
| Cache Isolation | ✅ Enforced | Per-device cache keys (line 158-161) |
| SQL Injection | ✅ Protected | Parameterized queries throughout |
| Rate Limiting | ⚠️ Recommended | Should be added at infrastructure level |

## Attack Scenarios Mitigated

### 1. Unauthenticated Access
**Attack:** `GET /api/esp32/snapshot?catId=<any-id>`  
**Mitigation:** Returns 401 Unauthorized (no JWT token)  
**Code:** Lines 120-124

### 2. Cross-User Data Access (Horizontal Privilege Escalation)
**Attack:** Authenticated user requests `?catId=<another-users-cat-id>`  
**Mitigation:** Returns 404 Cat not found (owner_id mismatch in SQL)  
**Code:** Lines 141-150

### 3. Cross-Origin Data Theft
**Attack:** Malicious website attempts to fetch snapshots via JavaScript  
**Mitigation:** Browser blocks response due to missing CORS headers  
**Code:** Lines 215-220 (no CORS headers set)

### 4. Global Snapshot Leakage
**Attack:** Request without catId to get "latest global snapshot"  
**Mitigation:** Returns 400 Bad Request (catId required)  
**Code:** Lines 127-133

### 5. Cache Poisoning
**Attack:** Upload snapshot to one device, retrieve from another  
**Mitigation:** Cache keyed per device.id, queries scoped to cat_id  
**Code:** Lines 37-39, 152-161

## Comparison: Before vs After

| Aspect | Before (Vulnerable) | After (Secured) |
|--------|---------------------|-----------------|
| Authentication | ❌ None | ✅ JWT required |
| Authorization | ❌ None | ✅ Owner verification |
| Data Scope | ❌ Global (newest across all users) | ✅ Per-user, per-cat |
| CORS | ❌ `Access-Control-Allow-Origin: *` | ✅ No CORS headers |
| Cache | ❌ Single global variable | ✅ Per-device Map |
| catId | ❌ Optional | ✅ Required |

## Recommendations

### Implemented ✅
1. JWT authentication on GET endpoint
2. Owner verification via SQL join
3. Removal of wildcard CORS headers
4. Per-device cache isolation
5. Required catId parameter
6. Parameterized SQL queries

### Additional Hardening (Future)
1. **Rate Limiting:** Add per-user rate limits (e.g., 100 requests/minute)
2. **Audit Logging:** Log all snapshot access attempts with userId and catId
3. **Image Watermarking:** Add user-specific watermark to prevent screenshot sharing
4. **Expiry Enforcement:** Enforce maximum snapshot age in database
5. **Device Verification:** Add device fingerprinting to prevent token theft

## Testing Recommendations

### Security Tests to Perform
1. **Unauthenticated Access:** Verify 401 without Bearer token
2. **Invalid Token:** Verify 401 with malformed/expired JWT
3. **Missing catId:** Verify 400 without catId parameter
4. **Wrong catId:** Verify 404 when requesting another user's cat
5. **CORS Headers:** Verify no `Access-Control-Allow-Origin` in response
6. **SQL Injection:** Test with malicious catId values (should be parameterized)
7. **Cache Isolation:** Verify user A cannot access user B's cached snapshots

### Test Commands
```bash
# Test 1: No auth
curl -i http://localhost:3000/api/esp32/snapshot?catId=test-cat-id

# Test 2: Invalid token
curl -i -H "Authorization: Bearer invalid-token" \
  http://localhost:3000/api/esp32/snapshot?catId=test-cat-id

# Test 3: Missing catId
curl -i -H "Authorization: Bearer <valid-token>" \
  http://localhost:3000/api/esp32/snapshot

# Test 4: Wrong catId (requires valid token for user A, catId for user B)
curl -i -H "Authorization: Bearer <user-a-token>" \
  http://localhost:3000/api/esp32/snapshot?catId=<user-b-cat-id>

# Test 5: Check CORS headers
curl -i -H "Origin: https://evil.com" \
  -H "Authorization: Bearer <valid-token>" \
  http://localhost:3000/api/esp32/snapshot?catId=<valid-cat-id>
```

## Conclusion

The ESP32 snapshot endpoint has been hardened with multiple layers of security:
1. **Authentication:** JWT verification prevents unauthenticated access
2. **Authorization:** SQL-level owner verification prevents cross-user access
3. **Data Scoping:** All queries filtered by verified cat_id
4. **CORS Policy:** No wildcard headers prevent cross-origin theft
5. **Cache Isolation:** Per-device cache prevents data leakage

The endpoint now follows security best practices and implements defense-in-depth with multiple independent security controls. Each control would need to fail independently for a breach to occur.
