import TelegramBot from 'node-telegram-bot-api';
import config from '../config/config.js';
import Bottleneck from 'bottleneck';
import { setTelegramChatId, updateClientPhone, changeOrderState, getClientInfo } from '../services/clientServices.js';

const token = config.API_KEY_TELEGRAM;

const domain = config.APP_DOMAIN;

const bot = new TelegramBot(token, { polling: false });

const limiter = new Bottleneck({
    minTime: 1000 / 30,
    maxConcurrent: 1,
});

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

bot.onText(/\/info/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        let info = await getClientInfo(chatId);
        let phoneNumber = info ? info.phoneNumber : 'No configurado';
        let remainingLeads = info ? info.remainingLeads : 'No hay ordenes activas';

        bot.sendMessage(chatId, `Numero de telefono configurado: ${phoneNumber}\nCantidad restante de leads: ${remainingLeads}`);
    } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, `Error al obtener info`);
    }
});

bot.onText(/\/number (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const newNumber = msg.text.split(" ")[1];
    try {
        await updateClientPhone(chatId, newNumber);
        bot.sendMessage(chatId, `Se cambio el numero de telefono: ${newNumber}`);
    } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, `Error al actualizar el numero`);
    }
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

bot.onText(/\/lead (start|stop)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const command = msg.text.split(" ")[1];
    console.log(command)
    try {
        let message;

        if (command === "start") {
            await changeOrderState(chatId, command);
            message = "Se inició el envío de leads.";
        } else if (command === "stop") {
            await changeOrderState(chatId, command);
            message = "Se detuvo el envío de leads.";
        } else {
            message = "El comando es desconocido, intenta con /lead stop o /lead start";
        }

        bot.sendMessage(chatId, message);
    } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, `Hubo un error al ejecutar el comando.`);
    }
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

export const sendContactTelegram = async (phoneNumber, chatId) => {
    const firstName = "Contacto";

    const sendContact = async () => {
        await bot.sendContact(chatId, phoneNumber, firstName, {
            vcard: `BEGIN:VCARD
                    VERSION:3.0
                    FN:${firstName}
                    TEL;TYPE=CELL:${phoneNumber}
                    END:VCARD`
        });
    };

    const sendMessage = async () => {
        const whatsappLink = `https://api.whatsapp.com/send/?phone=${phoneNumber}`;
        const messageText = `Hablar por whatsapp: [Contactar](${whatsappLink})`;
        await bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' });
    };

    try {
        await limiter.schedule(sendContact);
        await limiter.schedule(sendMessage);
    } catch (error) {
        console.error('Error al enviar el contacto o el enlace de WhatsApp:', error);
        if (error.response && error.response.statusCode === 429) {
            const retryAfter = parseInt(error.response.body.parameters.retry_after, 10) || 1;
            console.log(`Retrying after ${retryAfter} seconds`);
            setTimeout(() => sendContactTelegram(phoneNumber, chatId), retryAfter * 1000);
        }
    }
};


export { bot };