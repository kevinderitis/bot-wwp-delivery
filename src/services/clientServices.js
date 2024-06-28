import axios from 'axios';
import config from '../config/config.js';

export const getNextClient = async () => {
    try {
        const response = await axios.get(`${config.DELIVERY_LEADS_URL}/lead/deliver`);
        const clientData = response.data;

        return {
            phoneNumber: clientData.phoneNumber,
            telegram: clientData.telegram,
            welcomeMessage: clientData.welcomeMessage
        };
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
 
