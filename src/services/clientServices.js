import axios from 'axios';

export const getNextClient = async () => {
    try {
        const response = await axios.get('https://leadsdelivery-2a9a11368067.herokuapp.com/lead/deliver');
        const clientData = response.data;

        return {
            phoneNumber: clientData.phoneNumber,
            telegram: clientData.telegram
        };
    } catch (error) {
        console.error('Error al obtener el próximo cliente:', error.message);
        throw new Error('No se pudo obtener el próximo cliente');
    }
}

export const setTelegramChatId = async (chatId, userId) => {
    try {
        const response = await axios.post('https://leadsdelivery-2a9a11368067.herokuapp.com/client/telegram', {
            telegramChatId: chatId,
            userId
        });

        return response;
    } catch (error) {
        console.error('Error al enviar los datos del cliente:', error.message);
        throw new Error('No se pudo enviar los datos del cliente');
    }
}
 
