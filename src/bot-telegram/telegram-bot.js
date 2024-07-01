import TelegramBot from 'node-telegram-bot-api';
import config from '../config/config.js';
import { setTelegramChatId } from '../services/clientServices.js';

const token = config.API_KEY_TELEGRAM;

const domain = config.APP_DOMAIN;

const bot = new TelegramBot(token, { polling: false });

const welcomeMessage = 'Bienvenidos al bot de Vegas Marketing. Vas a poder recibir los leads y modificar la configuración de tu cuenta por este medio. Necesitas el ID de usuario que te proporcionamos para asociar esta cuenta de telegram a tu cuenta de Vegas Marketing.';

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Comenzar',
                        callback_data: 'aceptar'
                    }
                ]
            ],
        },
    });
});

bot.onText(/\/number (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.text.split(" ")[1];
    bot.sendMessage(chatId, `Configuración para el usuario ID: ${userId}`);
});

bot.onText(/\/user (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.text.split(" ")[1];
    try {
        await setTelegramChatId(chatId, userId);
        bot.sendMessage(chatId, `Configuración para el usuario ID: ${userId}`);
    } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, `No se pudo crear la configuración, verifica tu ID de usuario.`);
    }
});

bot.onText(/\/stop (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];
    bot.sendMessage(chatId, `Configuración para el usuario ID: ${userId}`);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    if (!messageText.startsWith('/')) {
        bot.sendMessage(chatId, "No reconozco ese comando. Usa /start, /number, /user <id>, /config, /stop <number>");
    }
});

bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;
    if (action === 'aceptar') {
        bot.sendMessage(chatId, 'Escribe /user seguido de tu ID para poder continuar con la configuración.\nPor ejemplo: /user 60d5f1234a4f123b5c6d7e8f');
    }
});

bot.setWebHook(`${domain}/webhook/${token}`);

export const sendContactTelegram = (phoneNumber, chatId) => {
    const firstName = "Contacto";
    bot.sendContact(chatId, phoneNumber, firstName, {
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:${firstName}
TEL;TYPE=CELL:${phoneNumber}
END:VCARD`
    });

    const whatsappLink = `https://api.whatsapp.com/send/?phone=${phoneNumber}`;
    const messageText = `Hablar por whatsapp: [Contactar](${whatsappLink})`;

    bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' }).catch((error) => {
        console.error('Error al enviar el enlace de WhatsApp:', error);
    });
};


export { bot };