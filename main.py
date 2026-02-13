import telebot
from telebot import types
import sqlite3
import time
import threading

TOKEN = "8591784580:AAFa4QeCnK0oXoXVRoE8j7HF2Y5HpihcZhY"

bot = telebot.TeleBot(TOKEN, parse_mode="HTML")

ADMINS = [6760193002, 2102631304]
CHANNEL_ID = -1003795653008

user_data = {}

# ---------------- DATABASE ----------------
db = sqlite3.connect("schedule.db", check_same_thread=False)
cur = db.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS posts(
id INTEGER PRIMARY KEY AUTOINCREMENT,
send_time INTEGER,
type TEXT,
file_id TEXT,
photo_id TEXT,
video_id TEXT,
thumb TEXT,
file_name TEXT,
title TEXT,
link TEXT
)
""")
db.commit()

# ---------------- POST FUNCTION ----------------
def send_post(data):
    name=data.get("file_name","Media")
    link=data.get("link","")

    caption=f"""
╭━━━〔 📦 <b>{name}</b> 〕━━━╮

📝 <b>{data['title']}</b>
"""

    if link:
        caption+=f"\n🔗 {link}\n"

    caption+="\n╰━━━━━━━━━━━━━━━╯"

    if data["type"]=="photo":
        bot.send_photo(CHANNEL_ID,data["photo_id"],caption=caption)

    else:
        if data.get("video"):
            bot.send_video(CHANNEL_ID,data["video"],caption=caption)
        elif data.get("thumb"):
            bot.send_photo(CHANNEL_ID,data["thumb"],caption=caption)
            bot.send_document(CHANNEL_ID,data["file_id"])
        else:
            bot.send_document(CHANNEL_ID,data["file_id"],caption=caption)

# ---------------- SCHEDULE CHECKER ----------------
def scheduler():
    while True:
        now=int(time.time())
        rows=cur.execute("SELECT * FROM posts WHERE send_time<=?",(now,)).fetchall()

        for row in rows:
            data={
                "type":row[2],
                "file_id":row[3],
                "photo_id":row[4],
                "video":row[5],
                "thumb":row[6],
                "file_name":row[7],
                "title":row[8],
                "link":row[9]
            }
            send_post(data)
            cur.execute("DELETE FROM posts WHERE id=?",(row[0],))
            db.commit()

        time.sleep(15)

threading.Thread(target=scheduler,daemon=True).start()

# ---------------- START ----------------
@bot.message_handler(commands=['start'])
def start(message):
    if message.from_user.id not in ADMINS:
        return bot.reply_to(message,"❌ Not allowed")

    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add("📁 Upload File","🖼 Upload Photo")

    bot.send_message(message.chat.id,"What do you want to upload?",reply_markup=markup)

# ---------------- FILE/PHOTO SELECT ----------------
@bot.message_handler(func=lambda m:m.text in ["📁 Upload File","🖼 Upload Photo"])
def choose(message):
    user_data[message.chat.id]={}

    if message.text=="📁 Upload File":
        user_data[message.chat.id]["type"]="file"
        bot.send_message(message.chat.id,"Send file now")
    else:
        user_data[message.chat.id]["type"]="photo"
        bot.send_message(message.chat.id,"Send photo")

# ---------------- RECEIVE FILE ----------------
@bot.message_handler(content_types=['document'])
def file_handler(message):
    if message.chat.id not in user_data: return
    if user_data[message.chat.id]["type"]!="file": return

    user_data[message.chat.id]["file_id"]=message.document.file_id
    user_data[message.chat.id]["file_name"]=message.document.file_name

    markup=types.ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add("Yes","No")
    bot.send_message(message.chat.id,"Add thumbnail/photo or video?",reply_markup=markup)

# ---------------- RECEIVE PHOTO ----------------
@bot.message_handler(content_types=['photo'])
def photo_handler(message):
    if message.chat.id not in user_data: return
    data=user_data[message.chat.id]

    if data["type"]=="photo":
        data["photo_id"]=message.photo[-1].file_id
        ask_link(message)
    else:
        data["thumb"]=message.photo[-1].file_id
        ask_link(message)

# ---------------- RECEIVE VIDEO ----------------
@bot.message_handler(content_types=['video'])
def video_handler(message):
    if message.chat.id not in user_data: return
    user_data[message.chat.id]["video"]=message.video.file_id
    ask_link(message)

def ask_link(message):
    bot.send_message(message.chat.id,"Send link or type skip")

# ---------------- YES/NO ----------------
@bot.message_handler(func=lambda m:m.text in ["Yes","No"])
def yesno(message):
    if message.text=="Yes":
        bot.send_message(message.chat.id,"Send photo or video")
    else:
        ask_link(message)

# ---------------- TIME HANDLER (IMPORTANT - ABOVE TEXT HANDLER) ----------------
@bot.message_handler(func=lambda m:m.chat.id in user_data and user_data[m.chat.id].get("waiting_time"))
def get_time(message):

    try:
        txt=message.text.strip()

        # auto fix 1:21 -> 01:21
        date,tm=txt.split()
        h,m=tm.split(":")
        if len(h)==1:
            h="0"+h
        txt=f"{date} {h}:{m}"

        t=time.strptime(txt,"%d-%m-%Y %H:%M")
        unix=int(time.mktime(t))

        data=user_data[message.chat.id]

        cur.execute("""INSERT INTO posts(send_time,type,file_id,photo_id,video_id,thumb,file_name,title,link)
        VALUES(?,?,?,?,?,?,?,?,?)""",
        (unix,data.get("type"),data.get("file_id"),data.get("photo_id"),
         data.get("video"),data.get("thumb"),data.get("file_name"),
         data.get("title"),data.get("link")))
        db.commit()

        bot.send_message(message.chat.id,"⏰ Scheduled successfully!")
        user_data.pop(message.chat.id)

    except:
        bot.send_message(message.chat.id,"❌ Wrong format\nExample: 25-02-2026 18:30")

# ---------------- TEXT HANDLER ----------------
@bot.message_handler(func=lambda m:m.chat.id in user_data and not user_data[m.chat.id].get("waiting_time"), content_types=['text'])
def text_handler(message):
    data=user_data[message.chat.id]

    if "link" not in data:
        if message.text.lower()=="skip":
            data["link"]=""
        else:
            data["link"]=message.text
        bot.send_message(message.chat.id,"Send title")
        return

    if "title" not in data:
        data["title"]=message.text

        markup=types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("🚀 Post Now",callback_data="now"))
        markup.add(types.InlineKeyboardButton("⏰ Schedule",callback_data="schedule"))

        bot.send_message(message.chat.id,"Post now or schedule?",reply_markup=markup)

# ---------------- CALLBACK ----------------
@bot.callback_query_handler(func=lambda call:True)
def callback(call):

    if call.data=="now":
        send_post(user_data[call.message.chat.id])
        bot.send_message(call.message.chat.id,"✅ Posted")
        user_data.pop(call.message.chat.id)

    elif call.data=="schedule":
        bot.send_message(call.message.chat.id,"Send date & time:\n25-02-2026 18:30")
        user_data[call.message.chat.id]["waiting_time"]=True

# ---------------- LIST SCHEDULED ----------------
@bot.message_handler(commands=['scheduled'])
def show_scheduled(message):
    rows=cur.execute("SELECT id,title,send_time FROM posts").fetchall()

    if not rows:
        return bot.send_message(message.chat.id,"No scheduled posts")

    text="📅 Scheduled Posts:\n\n"
    for r in rows:
        t=time.strftime("%d-%m-%Y %H:%M",time.localtime(r[2]))
        text+=f"ID: {r[0]}\n{r[1]}\n{t}\n\n"

    bot.send_message(message.chat.id,text)

# ---------------- DELETE SCHEDULE ----------------
@bot.message_handler(commands=['cancel'])
def cancel(message):
    try:
        post_id=int(message.text.split()[1])
        cur.execute("DELETE FROM posts WHERE id=?",(post_id,))
        db.commit()
        bot.send_message(message.chat.id,"🗑 Deleted")
    except:
        bot.send_message(message.chat.id,"Use: /cancel ID")

print("Bot Running...")
bot.infinity_polling()