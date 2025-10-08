import asyncio
import time
from telethon import TelegramClient, events
from telethon.tl.types import Message
import config

class TelegramBotAutomation:
    def __init__(self):
        self.client = TelegramClient(
            'session_name',
            config.API_ID,
            config.API_HASH
        )
        self.approved_codes = set()
        self.declined_codes = set()
        self.load_existing_codes()
        
    def load_existing_codes(self):
        """Load already processed codes from files"""
        try:
            with open(config.APPROVED_FILE, 'r') as f:
                self.approved_codes = set(line.strip() for line in f if line.strip())
        except FileNotFoundError:
            pass
            
        try:
            with open(config.DECLINED_FILE, 'r') as f:
                self.declined_codes = set(line.strip() for line in f if line.strip())
        except FileNotFoundError:
            pass
    
    def save_approved_code(self, code):
        """Save approved code to file"""
        with open(config.APPROVED_FILE, 'a') as f:
            f.write(f"{code}\n")
        self.approved_codes.add(code)
    
    def save_declined_code(self, code):
        """Save declined code to file"""
        with open(config.DECLINED_FILE, 'a') as f:
            f.write(f"{code}\n")
        self.declined_codes.add(code)
    
    async def send_code_to_bot(self, code):
        """Send code to target bot"""
        try:
            await self.client.send_message(config.TARGET_BOT, code)
            print(f"✅ Code sent: {code}")
            return True
        except Exception as e:
            print(f"❌ Failed to send code {code}: {e}")
            return False
    
    async def forward_to_group(self, message, code):
        """Forward approved message to group"""
        try:
            await self.client.forward_messages(config.TARGET_GROUP, message)
            print(f"📤 Approved message forwarded to group for code: {code}")
            return True
        except Exception as e:
            print(f"❌ Failed to forward message: {e}")
            return False
    
    async def process_bot_response(self, event):
        """Process responses from the target bot"""
        if not event.is_private:
            return
            
        sender = await event.get_sender()
        if not sender or not sender.username:
            return
            
        if sender.username.lower() != config.TARGET_BOT.lower():
            return
        
        message_text = event.raw_text.lower()
        print(f"🤖 Bot replied: {event.raw_text}")
        
        # Extract code from message (you might need to adjust this based on bot's response format)
        code = self.extract_code_from_message(event.raw_text)
        
        if not code:
            print("⚠️ Could not extract code from bot response")
            return
        
        if any(word in message_text for word in ['approve', 'approved', 'success', 'valid', 'correct']):
            print(f"🎉 Code approved: {code}")
            self.save_approved_code(code)
            
            # Forward the message to group
            await self.forward_to_group(event.message, code)
            
        elif any(word in message_text for word in ['decline', 'declined', 'invalid', 'wrong', 'error']):
            print(f"❌ Code declined: {code}")
            self.save_declined_code(code)
    
    def extract_code_from_message(self, message):
        """Extract code from bot response - adjust based on your bot's response format"""
        # Simple extraction - you might need to customize this
        words = message.split()
        for word in words:
            if len(word) >= 6 and any(char.isdigit() for char in word):
                return word
        return None
    
    async def run_automation(self):
        """Main automation function"""
        await self.client.start()
        print("🚀 Telegram client started!")
        
        # Add event handler for bot responses
        self.client.add_event_handler(
            self.process_bot_response,
            events.NewMessage(incoming=True)
        )
        
        # Read codes from file
        try:
            with open(config.CODES_FILE, 'r') as f:
                codes = [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            print(f"❌ Codes file '{config.CODES_FILE}' not found!")
            return
        
        if not codes:
            print("❌ No codes found in the file!")
            return
        
        print(f"📄 Found {len(codes)} codes to process")
        
        # Filter out already processed codes
        new_codes = [
            code for code in codes 
            if code not in self.approved_codes and code not in self.declined_codes
        ]
        
        if not new_codes:
            print("✅ All codes have been processed already!")
            return
        
        print(f"🆕 {len(new_codes)} new codes to send")
        
        # Send codes one by one
        for i, code in enumerate(new_codes, 1):
            print(f"\n📤 Sending code {i}/{len(new_codes)}: {code}")
            
            success = await self.send_code_to_bot(code)
            
            if success:
                print(f"⏳ Waiting {config.DELAY_BETWEEN_CODES} seconds...")
                await asyncio.sleep(config.DELAY_BETWEEN_CODES)
            else:
                print("⚠️ Skipping to next code after failure...")
        
        print("\n🎯 Automation completed! Waiting for bot responses...")
        print("Press Ctrl+C to stop")
        
        # Keep running to listen for bot responses
        await self.client.run_until_disconnected()

async def main():
    automation = TelegramBotAutomation()
    await automation.run_automation()

if __name__ == '__main__':
    asyncio.run(main())
