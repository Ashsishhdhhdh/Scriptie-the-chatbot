const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Replace the value below with the Telegram token you receive from @BotFather
const token = process.env.Scriptie_token;
const genAI = new GoogleGenerativeAI(process.env.gemini_API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Check if message contains a photo
    if (msg.photo) {
        // Get the file ID of the largest version of the photo
        const fileId = msg.photo[msg.photo.length - 1].file_id;

        try {
            // Get file path from Telegram
            const file = await bot.getFile(fileId);
            const filePath = file.file_path;

            // Construct the download URL
            const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

            // Download the image and save it
            const response = await axios({
                url: downloadUrl,
                method: 'GET',
                responseType: 'stream',
            });
            const fileName = `${fileId}.jpg`;

            // Create a write stream to save the image
            const writer = fs.createWriteStream(fileName);
            response.data.pipe(writer);

            // Wait for the image to be fully downloaded
            writer.on('finish', async () => {
                bot.sendMessage(chatId, 'Processing your image...');

                // Generate response for the image
                const prompt = "Give me the point wise detailed description about the image that I provided. Respond with appropriate and interactive emojis.";
                const image = {
                    inlineData: {
                        data: Buffer.from(fs.readFileSync(fileName)).toString("base64"),
                        mimeType: "image/jpg",
                    },
                };

                try {
                    const result1 = await model.generateContent([prompt, image]);
                    bot.sendMessage(chatId, result1.response.text());
                } catch (error) {
                    bot.sendMessage(chatId, `Error processing image: ${error.message}`);
                }
            });

            // Handle errors during image download
            writer.on('error', (error) => {
                bot.sendMessage(chatId, `Error saving image: ${error.message}`);
            });
        } catch (error) {
            bot.sendMessage(chatId, `Error retrieving file: ${error.message}`);
        }

    } else if (msg.text) {
        async function gemini_response_for_text() {
            const prompt2 = msg.text;
            const result2 = await model.generateContent(prompt2 + ". Respond with appropriate and interactive emojis.");
            return result2;
        }

        gemini_response_for_text()
            .then(result2 => {
                bot.sendMessage(chatId, result2.response.text());
            })
            .catch(error => bot.sendMessage(chatId, `Error: ${error.message}`));
    }
});
