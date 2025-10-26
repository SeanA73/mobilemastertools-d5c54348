# ☕ Install Java JDK for Android Development

Java Development Kit (JDK) is required to generate Android signing keystores and build Android apps.

## Quick Install Options

### Option 1: Install via Winget (Recommended - Windows 11)

```powershell
# Install Microsoft OpenJDK 17
winget install Microsoft.OpenJDK.17
```

After installation, **restart your terminal** for PATH changes to take effect.

### Option 2: Manual Download

1. **Download OpenJDK 17**:
   - Go to: https://adoptium.net/
   - Select: **OpenJDK 17 (LTS)**
   - Platform: **Windows x64**
   - Package Type: **JDK**
   - Click **Download**

2. **Install**:
   - Run the downloaded `.msi` file
   - Follow installation wizard
   - **IMPORTANT**: Check "Add to PATH" option
   - Complete installation

3. **Verify Installation**:
   ```powershell
   # Restart PowerShell, then:
   java -version
   ```

   Should show:
   ```
   openjdk version "17.0.x" 2023-xx-xx
   OpenJDK Runtime Environment...
   ```

### Option 3: Android Studio (Includes JDK)

If you plan to use Android Studio:

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. JDK is included automatically
4. Android Studio also adds Gradle and Android SDK

## Verify Installation

```powershell
# Check Java version
java -version

# Check keytool (needed for keystore generation)
keytool

# Should show keytool help text
```

## Set JAVA_HOME (If Needed)

If `keytool` doesn't work after installing Java:

1. **Find Java installation path**:
   ```powershell
   where.exe java
   # Usually: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\bin\java.exe
   ```

2. **Set JAVA_HOME**:
   ```powershell
   # Get the JDK directory (without \bin\java.exe)
   $jdkPath = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   
   # Set for current session
   $env:JAVA_HOME = $jdkPath
   $env:PATH += ";$jdkPath\bin"
   
   # Verify
   java -version
   keytool
   ```

3. **Set Permanently** (Optional):
   - Press `Windows + R`
   - Type: `sysdm.cpl`
   - Advanced tab → Environment Variables
   - Under "System variables", click "New"
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - Edit PATH, add: `%JAVA_HOME%\bin`
   - Click OK
   - Restart terminal

## After Java Installation

You can now proceed with Android deployment:

```powershell
# Generate Android keystore
keytool -genkey -v -keystore mobiletoolsbox-release-key.keystore -alias mobiletoolsbox -keyalg RSA -keysize 2048 -validity 10000

# Continue with build process
.\build-android.ps1
```

## Troubleshooting

### "keytool is not recognized"

**Solution**: Java is not in PATH
- Restart terminal after Java installation
- Or manually set JAVA_HOME (see above)

### "java command not found"

**Solution**: Java not installed correctly
- Reinstall Java
- Ensure "Add to PATH" is checked during installation

### Alternative: Use Android Studio's JDK

If you have Android Studio installed:

```powershell
# Find Android Studio's JDK
cd "C:\Program Files\Android\Android Studio\jbr\bin"
.\keytool -genkey -v -keystore C:\Users\shadi\OneDrive\Desktop\projects\MobileMasterTool\mobiletoolsbox-release-key.keystore -alias mobiletoolsbox -keyalg RSA -keysize 2048 -validity 10000
```

## Quick Reference

- **Download JDK**: https://adoptium.net/
- **Android Studio**: https://developer.android.com/studio
- **Documentation**: https://docs.oracle.com/en/java/javase/17/

---

**After installing Java, return to `QUICK_START_DEPLOYMENT.md` to continue with Android deployment!**

