@echo off
title NASSAU TICKETS - INSTALADOR
echo ==========================================
echo  NASSAU TICKETS - Instalando banco...
echo ==========================================

set MYSQL=
for /D %%D in ("C:\Program Files\MariaDB *") do if exist "%%D\bin\mysql.exe" set MYSQL="%%D\bin\mysql.exe"
for /D %%D in ("C:\Program Files (x86)\MariaDB *") do if exist "%%D\bin\mysql.exe" set MYSQL="%%D\bin\mysql.exe"
for /D %%D in ("C:\Program Files\MySQL\MySQL Server *") do if exist "%%D\bin\mysql.exe" set MYSQL="%%D\bin\mysql.exe"
if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL="C:\xampp\mysql\bin\mysql.exe"

if "%MYSQL%"=="" (
  echo.
  echo [ERRO] MariaDB nao encontrado!
  echo Baixa aqui: https://mariadb.org/download/
  echo Instala, cria senha root 1234 e roda esse arquivo de novo.
  pause
  exit
)

echo Banco encontrado: %MYSQL%
echo.
echo Vai pedir a senha do root 2x - digita a senha que voce criou na instalacao
echo Se voce colocou 1234 na instalacao, digita 1234 aqui
echo.

%MYSQL% -u root -p -e "DROP DATABASE IF EXISTS nassauTickets; CREATE DATABASE nassauTickets;"
%MYSQL% -u root -p nassauTickets < backend\database.sql

echo.
echo ==========================================
echo  BANCO CRIADO COM SUCESSO!
echo ==========================================
echo Agora abre 2 janelas:
echo Janela 1: cd backend e npm run dev
echo Janela 2: cd frontend e npm run dev
pause
