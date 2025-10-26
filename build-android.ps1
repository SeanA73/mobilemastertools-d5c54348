# MobileToolsBox Android Build Script for Windows
# This script builds the Android app bundle for Google Play Store

Write-Host "MobileToolsBox Android Build Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if key.properties exists
if (-Not (Test-Path "android\key.properties")) {
    Write-Host "Warning: android/key.properties not found!" -ForegroundColor Yellow
    Write-Host "Please create android/key.properties from the template and fill in your keystore details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To generate a keystore, run:" -ForegroundColor Yellow
    Write-Host "keytool -genkey -v -keystore mobiletoolsbox-release-key.keystore -alias mobiletoolsbox -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue without signing? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Step 1: Build web app
Write-Host "Step 1: Building web application..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Web build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Web build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Copy assets to Android
Write-Host "Step 2: Copying assets to Android..." -ForegroundColor Green
if (Test-Path "android\app\src\main\assets\public") {
    Remove-Item -Recurse -Force "android\app\src\main\assets\public"
}
Copy-Item -Path "dist\public" -Destination "android\app\src\main\assets\" -Recurse -Force
Write-Host "Assets copied" -ForegroundColor Green
Write-Host ""

# Step 3: Clean previous builds
Write-Host "Step 3: Cleaning previous builds..." -ForegroundColor Green
Push-Location android
.\gradlew clean | Out-Null
Pop-Location
Write-Host "Clean complete" -ForegroundColor Green
Write-Host ""

# Step 4: Build AAB
Write-Host "Step 4: Building release AAB..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Push-Location android
.\gradlew bundleRelease
$buildSuccess = $LASTEXITCODE -eq 0
Pop-Location

if ($buildSuccess) {
    Write-Host ""
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Check if AAB was created
    $aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        $aabSize = (Get-Item $aabPath).Length / 1MB
        Write-Host "AAB created successfully!" -ForegroundColor Green
        Write-Host "Location: $aabPath" -ForegroundColor White
        Write-Host "Size: $($aabSize.ToString('0.00')) MB" -ForegroundColor White
        Write-Host ""
        
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to https://play.google.com/console" -ForegroundColor White
        Write-Host "2. Create or select your app" -ForegroundColor White
        Write-Host "3. Go to Production -> Create new release" -ForegroundColor White
        Write-Host "4. Upload: $aabPath" -ForegroundColor White
        Write-Host "5. Add release notes and submit for review" -ForegroundColor White
        Write-Host ""
        
        # Optionally open the folder
        $openFolder = Read-Host "Open build folder? (Y/n)"
        if ($openFolder -ne "n" -and $openFolder -ne "N") {
            explorer "android\app\build\outputs\bundle\release"
        }
    } else {
        Write-Host "AAB file not found at expected location!" -ForegroundColor Red
        Write-Host "Check build output above for errors" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Build failed! Check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Keystore file not found" -ForegroundColor White
    Write-Host "- Incorrect keystore password" -ForegroundColor White
    Write-Host "- Gradle configuration errors" -ForegroundColor White
    Write-Host ""
    exit 1
}
