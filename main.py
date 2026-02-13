import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

TOKEN = "8591784580:AAFLjymXAlrF6LOV6resLDvSLzBkwagVniE"
OWNER_ID =  2102631304       # apna Telegram ID
GROUP_ID = -3795653008   # group ID

bot = telebot.TeleBot(TOKEN)

user_data = {}
file_db = {}

# 🔹 Start Upload Flow
@bot.message_handler(commands=['upload'])
def start_upload(message):
    if message.from_user.id != OWNER_ID:
        return
    user_data[message.chat.id] = {}
    bot.send_message(message.chat.id, "📤 Kya upload karna hai?\n1️⃣ File\n2️⃣ Photo")
    bot.register_next_step_handler(message, choose_type)

def choose_type(message):
    if message.text == "1" or "file" in message.text.lower():
        user_data[message.chat.id]['type'] = 'document'
        bot.send_message(message.chat.id, "📎 File bhejo")
        bot.register_next_step_handler(message, get_file)
    else:
        user_data[message.chat.id]['type'] = 'photo'
        bot.send_message(message.chat.id, "🖼 Photo bhejo")
        bot.register_next_step_handler(message, get_file)

def get_file(message):
    data = user_data[message.chat.id]

    if data['type'] == 'document' and message.document:
        data['file_id'] = message.document.file_id
    elif data['type'] == 'photo' and message.photo:
        data['file_id'] = message.photo[-1].file_id
    else:
        bot.send_message(message.chat.id, "❌ Invalid file, dubara bhejo")
        return

    bot.send_message(message.chat.id, "🖼 Thumbnail (photo/video) bhejna hai?\nYa 'skip' likho")
    bot.register_next_step_handler(message, get_thumbnail)

def get_thumbnail(message):
    data = user_data[message.chat.id]

    if message.text and message.text.lower() == "skip":
        data['thumb'] = None
    elif message.photo:
        data['thumb'] = message.photo[-1].file_id
    elif message.video:
        data['thumb'] = message.video.file_id
    else:
        data['thumb'] = None

    bot.send_message(message.chat.id, "🔗 Koi external link add karna hai?\nYa 'skip'")
    bot.register_next_step_handler(message, get_link)

def get_link(message):
    data = user_data[message.chat.id]
    data['link'] = None if message.text.lower() == "skip" else message.text

    bot.send_message(message.chat.id, "📝 File ka title bhejo")
    bot.register_next_step_handler(message, get_title)

def get_title(message):
    data = user_data[message.chat.id]
    data['title'] = message.text

    preview = f"""
📦 *Preview*

📌 Title: {data['title']}
🔗 Link: {data['link'] or 'Nahi'}

Confirm? (yes/no)
"""
    bot.send_message(message.chat.id, preview, parse_mode="Markdown")
    bot.register_next_step_handler(message, confirm_upload)

def confirm_upload(message):
    if message.text.lower() != "yes":
        bot.send_message(message.chat.id, "❌ Cancelled")
        return

    data = user_data[message.chat.id]
    file_key = str(len(file_db) + 1)
    file_db[file_key] = data['file_id']

    bot_username = bot.get_me().username
    download_link = f"https://t.me/{bot_username}?start={file_key}"

    caption = f"""
📂 *{data['title']}*

🔗 Download: {download_link}
"""
    if data['link']:
        caption += f"\n🌐 Link: {data['link']}"

    # 🔹 Send to group with thumbnail
    if data['thumb']:
        bot.send_photo(GROUP_ID, data['thumb'], caption=caption, parse_mode="Markdown")
    else:
        bot.send_message(GROUP_ID, caption, parse_mode="Markdown")

    bot.send_message(message.chat.id, "✅ Group me post ho gaya!")

# 🔹 User download handler
@bot.message_handler(commands=['start'])
def send_file(message):
    args = message.text.split()
    if len(args) > 1:
        key = args[1]
        if key in file_db:
            bot.send_document(message.chat.id, file_db[key])
        else:
            bot.send_message(message.chat.id, "❌ File not found")

bot.infinity_polling()
