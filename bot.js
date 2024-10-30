 const TelegramBot = require('node-telegram-bot-api');

const fs = require("fs"); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.Scriptie_token;
const genAI = new GoogleGenerativeAI(process.env.gemini_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const prompt = msg.text;
    async function gemini_response() {
        const result = await model.generateContent(prompt + ". Respond with appropriate and interactive emojis.");
        return result;
    }
    
    gemini_response()
        .then(result => {
            bot.sendMessage(chatId, result.response.text()); 
        })
        .catch(error => bot.sendMessage(chatId, `Error: ${error.message}`));
});


