#!/bin/bash

echo "📱 Setting up Telegram Automation for Termux..."

# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install python -y
pkg install python-pip -y
pkg install git -y

# Install Python packages
pip install telethon

# Create necessary files
touch codes.txt
touch approved.txt
touch declined.txt

echo "✅ Setup completed!"
echo "📝 Please edit config.py with your API credentials"
echo "📝 Add codes to codes.txt file"
echo "🚀 Run with: python telegram_bot_automation.py"
