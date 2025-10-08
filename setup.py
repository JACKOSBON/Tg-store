# Install required packages
pkg update && pkg upgrade -y
pkg install python -y
pip install telethon

# Create directory
mkdir telegram-auto
cd telegram-auto

# Create the script file
nano telegram_automation_v2.py
# Paste the script content

# Create codes file
nano codes.txt
# Add your codes, one per line

# Edit configuration in the script
nano telegram_automation_v2.py
# Edit API_ID, API_HASH, TARGET_BOT, TARGET_GROUP
