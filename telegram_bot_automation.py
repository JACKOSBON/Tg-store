import asyncio
import time
import re
from telethon import TelegramClient, events
from telethon.tl.types import Message
import os

# Configuration - EDIT THESE VALUES
API_ID = 12345678  # Get from https://my.telegram.org
API_HASH = 'your_api_hash_here'  # Get from https://my.telegram.org
TARGET_BOT = '@username_of_bot_to_check'  # Bot you want to send codes to
TARGET_GROUP = '@your_group_username'  # Group where approved messages will be forwarded
CODES_FILE = 'codes.txt'
APPROVED_FILE = 'approved.txt'
DECLINED_FILE = 'declined.txt'
DELAY_BETWEEN_CODES = 5  # Seconds between sending codes

class TelegramAutomation:
    def __init__(self):
        self.client = TelegramClient('session_name', API_ID, API_HASH)
        self.current_code = None
        self.waiting_for_result = False
        self.code_sent_time = None
        self.processed_codes = self.load_processed_codes()
        
    def load_processed_codes(self):
        """Load already processed codes from files"""
        processed = set()
        try:
            with open(APPROVED_FILE, 'r') as f:
                for line in f:
                    if ':' in line:
                        processed.add(line.split(':')[0].strip())
        except FileNotFoundError:
            pass
            
        try:
            with open(DECLINED_FILE, 'r') as f:
                for line in f:
                    if ':' in line:
                        processed.add(line.split(':')[0].strip())
        except FileNotFoundError:
            pass
        return processed
    
    def save_approved(self, code, message):
        """Save approved code to file"""
        with open(APPROVED_FILE, 'a') as f:
            f.write(f"{code}: {message} - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        print(f"✅ APPROVED: {code}")
    
    def save_declined(self, code, message):
        """Save declined code to file"""
        with open(DECLINED_FILE, 'a') as f:
            f.write(f"{code}: {message} - {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        print(f"❌ DECLINED: {code}")
    
    async def send_code(self, code):
        """Send code to target bot"""
        try:
            await self.client.send_message(TARGET_BOT, code)
            self.current_code = code
            self.waiting_for_result = True
            self.code_sent_time = time.time()
            print(f"📤 Code sent: {code}")
            return True
        except Exception as e:
            print(f"❌ Failed to send code {code}: {e}")
            return False
    
    async def forward_to_group(self, message):
        """Forward approved message to group"""
        try:
            await self.client.forward_messages(TARGET_GROUP, message)
            print(f"📤 Message forwarded to group for code: {self.current_code}")
            return True
        except Exception as e:
            print(f"❌ Failed to forward message: {e}")
            return False
    
    async def handle_bot_response(self, event):
        """Handle responses from the target bot"""
        if not event.is_private:
            return
            
        sender = await event.get_sender()
        if not sender or not sender.username:
            return
            
        # Check if message is from target bot
        if sender.username.lower() != TARGET_BOT.lstrip('@').lower():
            return
        
        message_text = event.raw_text
        print(f"🤖 Bot replied: {message_text}")
        
        # Skip "checking" messages
        if any(word in message_text.lower() for word in ['checking', 'processing', 'verifying', 'please wait']):
            print("⏳ Bot is checking... waiting for final result")
            return
        
        # Check if we're waiting for a result and this is the final response
        if self.waiting_for_result and self.current_code:
            # Check for approve/decline keywords
            if any(word in message_text.lower() for word in ['approve', 'approved', 'success', 'valid', 'correct', 'working']):
                self.save_approved(self.current_code, message_text)
                await self.forward_to_group(event.message)
                self.waiting_for_result = False
                self.current_code = None
                
            elif any(word in message_text.lower() for word in ['decline', 'declined', 'invalid', 'wrong', 'error', 'failed', 'not valid']):
                self.save_declined(self.current_code, message_text)
                self.waiting_for_result = False
                self.current_code = None
    
    async def run_automation(self):
        """Main automation function"""
        await self.client.start()
        print("🚀 Telegram client started!")
        print(f"🤖 Target bot: {TARGET_BOT}")
        print(f"👥 Target group: {TARGET_GROUP}")
        
        # Add event handler for bot responses
        self.client.add_event_handler(
            self.handle_bot_response,
            events.NewMessage(incoming=True)
        )
        
        # Read codes from file
        try:
            with open(CODES_FILE, 'r') as f:
                all_codes = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            print(f"❌ Codes file '{CODES_FILE}' not found!")
            return
        
        if not all_codes:
            print("❌ No codes found in the file!")
            return
        
        # Filter out already processed codes
        new_codes = [code for code in all_codes if code not in self.processed_codes]
        
        if not new_codes:
            print("✅ All codes have been processed already!")
            return
        
        print(f"📄 Total codes: {len(all_codes)} | New codes: {len(new_codes)}")
        
        # Process codes one by one
        for index, code in enumerate(new_codes, 1):
            print(f"\n{'='*50}")
            print(f"🔄 Processing code {index}/{len(new_codes)}: {code}")
            
            # Send the code
            success = await self.send_code(code)
            if not success:
                continue
            
            # Wait for bot response with timeout
            max_wait_time = 30  # Maximum wait time for bot response in seconds
            start_time = time.time()
            
            while self.waiting_for_result and (time.time() - start_time) < max_wait_time:
                elapsed = time.time() - start_time
                print(f"⏰ Waiting for result... {int(elapsed)}s/{max_wait_time}s", end='\r')
                await asyncio.sleep(2)
            
            if self.waiting_for_result:
                print(f"\n⏰ Timeout waiting for response for code: {code}")
                self.save_declined(code, "TIMEOUT - No response from bot")
                self.waiting_for_result = False
                self.current_code = None
            
            # Delay before next code
            if index < len(new_codes):
                print(f"⏳ Waiting {DELAY_BETWEEN_CODES} seconds before next code...")
                await asyncio.sleep(DELAY_BETWEEN_CODES)
        
        print(f"\n{'='*50}")
        print("🎯 All codes processed!")
        print("📊 Summary:")
        print(f"   📁 Approved: {APPROVED_FILE}")
        print(f"   📁 Declined: {DECLINED_FILE}")
        print("\nPress Ctrl+C to exit")

async def main():
    automation = TelegramAutomation()
    await automation.run_automation()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Script stopped by user")
