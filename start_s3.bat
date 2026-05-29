@echo off
:: Запуск Rclone (если он теперь лежит в папке с проектом)
echo Запуск Rclone...
start "Rclone"  rclone serve s3 C:\Users\Настя\Desktop\2\ --addr :9000

:: Запуск бэкенда Go
echo Запуск Go сервера...
start "Go Backend" go run main.go

:: Запуск фронтенда
echo Запуск React...
cd frontend
start "React Frontend" npm run dev

echo Все сервисы запущены!
pause