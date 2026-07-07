# Token Storage Security Mitigation

## Issue
The application stores JWT bearer tokens in WebView localStorage, which could potentially be extracted from Android backups if backup mechanisms are enabled.

## Mitigation Strategy

### 1. Android Backup Prevention (Defense in Depth)

#### Primary Control: Backup Disabled
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Setting**: `android:allowBackup="false"`
- **Effect**: Disables Android's built-in backup mechanism entirely

#### Secondary Control: Explicit Backup Exclusion Rules (Android 12+)
- **File**: `android/app/src/main/res/xml/backup_rules.xml`
- **Setting**: `android:dataExtractionRules="@xml/backup_rules"`
- **Effect**: Explicitly excludes:
  - All root app data
  - All databases
  - All shared preferences
  - WebView data directory (`app_webview/`) containing localStorage

#### Tertiary Control: Legacy Backup Exclusion (Android 11 and below)
- **File**: `android/app/src/main/res/xml/backup_descriptor.xml`
- **Setting**: `android:fullBackupContent="@xml/backup_descriptor"`
- **Effect**: Explicitly excludes:
  - WebView data directory (`app_webview/`)
  - All databases
  - All shared preferences

### 2. Code-Level Improvements

#### Storage Abstraction Layer
- **File**: `src/lib/AuthContext.tsx`
- **Implementation**: Created `secureStorage` abstraction layer
- **Purpose**: 
  - Centralizes all token storage operations
  - Makes future migration to platform-specific secure storage straightforward
  - Documents security limitations and recommended enhancements

#### Async Storage Operations
- All token storage operations are now async-aware
- Enables seamless future migration to secure storage plugins that require async operations
- Updated all callers to properly await storage operations

### 3. Documentation

#### In-Code Security Notes
Comprehensive security documentation added to `AuthContext.tsx` explaining:
- Current limitations of localStorage
- Mitigation measures in place
- Recommended future enhancements
- Migration path to secure storage

## Residual Risk

While these mitigations significantly reduce the attack surface, localStorage in WebView still has inherent limitations:
- Not encrypted at rest on the device
- Accessible to JavaScript in the same origin
- Vulnerable to device-level attacks (root access, debugging tools)

## Recommended Future Enhancement

For production deployments requiring higher security, consider implementing platform-specific secure storage:

### Option 1: Capacitor Community Secure Storage Plugin
```bash
npm install @capacitor-community/secure-storage-plugin
```

This provides:
- **Android**: Android Keystore encryption
- **iOS**: iOS Keychain storage
- **Web**: Falls back to localStorage (acceptable for web context)

### Option 2: Custom Native Implementation
Implement custom native modules using:
- **Android**: EncryptedSharedPreferences with Android Keystore
- **iOS**: Keychain Services API

## Migration Path

The `secureStorage` abstraction layer in `AuthContext.tsx` is designed for easy migration:

1. Install secure storage plugin
2. Update `secureStorage.getItem()`, `setItem()`, and `removeItem()` implementations
3. No changes needed to calling code (already async-aware)

Example:
```typescript
import { SecureStoragePlugin } from '@capacitor-community/secure-storage-plugin';

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value;
    } catch {
      return null;
    }
  },
  // ... similar for setItem and removeItem
};
```

## Testing Recommendations

1. **Backup Verification**: Verify that `adb backup` does not include app data
2. **Root Access Testing**: Test token extraction resistance on rooted devices
3. **Secure Storage Migration**: When implementing secure storage, verify tokens are properly encrypted at rest

## References

- [Android Backup Documentation](https://developer.android.com/guide/topics/data/backup)
- [Android Data Extraction Rules](https://developer.android.com/about/versions/12/backup-restore)
- [Capacitor Secure Storage Plugin](https://github.com/capacitor-community/secure-storage-plugin)
- [OWASP Mobile Security Testing Guide - Data Storage](https://github.com/OWASP/owasp-mstg/blob/master/Document/0x05d-Testing-Data-Storage.md)
