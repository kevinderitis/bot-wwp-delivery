import axios from 'axios';
import config from '../config/config.js';

const welcomeText = `¡Hola! 👋 ¿Estas listo para jugar? Para darte la mejor atención, tenés un cajero personal para hablar con vos. Acá te envío el numero. ¡Mucha suerte! 🍀`;

export const getNextClient = async () => {
    try {
        const response = await axios.get(`${config.DELIVERY_LEADS_URL}/lead/deliver`);
        const clientData = response.data;

        return {
            phoneNumber: clientData.phoneNumber,
            telegram: clientData.telegram,
            welcomeMessage: clientData.welcomeMessage || welcomeText
        };
    } catch (error) {
        console.error('Error al obtener el próximo cliente:', error.message);
        throw new Error('No se pudo obtener el próximo cliente');
    }
}

export const getClientInfo = async chatId => {
    try {
        const response = await axios.get(`${config.DELIVERY_LEADS_URL}/client/data/${chatId}`);
        const clientData = response.data;
        return clientData;
    } catch (error) {
        console.error('Error al obtener el próximo cliente:', error.message);
        throw new Error('No se pudo obtener el próximo cliente');
    }
}

export const setTelegramChatId = async (chatId, userId) => {
    try {
        const response = await axios.post(`${config.DELIVERY_LEADS_URL}/client/telegram`, {
            telegramChatId: chatId,
            userId
        });

        return response;
    } catch (error) {
        console.error('Error al enviar los datos del cliente:', error.message);
        throw new Error('No se pudo enviar los datos del cliente');
    }
}

export const updateClientPhone = async (chatId, phone) => {
    try {
        const response = await axios.post(`${config.DELIVERY_LEADS_URL}/client/user/phone`, {
            telegramChatId: chatId,
            phone
        }
        );

        return response;
    } catch (error) {
        console.error('Error al enviar los datos del cliente:', error.message);
        throw new Error('No se pudo enviar los datos del cliente');
    }
}

export const changeOrderState = async (chatId, command) => {
    let url = `${config.DELIVERY_LEADS_URL}/order/user/${command}`;
    try {
        const response = await axios.post(url, {
            tgchatid: chatId
        }
        );

        return response;
    } catch (error) {
        console.error('Error al enviar los datos del cliente:', error.message);
        throw new Error('No se pudo enviar los datos del cliente');
    }
}