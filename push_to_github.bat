@echo off
title Push Meme Duel to GitHub
cd /d "%~dp0"
echo ========================================================
echo Pushing Meme Duel to https://github.com/AkashiZai/AshiGame.git
echo ========================================================
git push -u origin main --force
if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Pushed to GitHub successfully!
    echo.
    echo Now go back to Render dashboard and click:
    echo "Manual Deploy" -> "Deploy latest commit"
    echo ========================================================
) else (
    echo.
    echo Push failed. Please check your GitHub login or permissions.
)
pause
