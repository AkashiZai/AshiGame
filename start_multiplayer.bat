@echo off
title Meme Duel Multiplayer Server
cd /d "%~dp0"
echo Starting Meme Duel Multiplayer Server...
start "" "http://localhost:3000"
node server.js
pause
