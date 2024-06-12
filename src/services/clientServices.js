import axios from 'axios';

export const getNextClient = async () => {
    try {
        const response = await axios.get('https://leadsdelivery-2a9a11368067.herokuapp.com/lead/deliver');
        const clientData = response.data;

        return {
            phoneNumber: clientData.phoneNumber
        };
    } catch (error) {
        console.error('Error al obtener el próximo cliente:', error.message);
        throw new Error('No se pudo obtener el próximo cliente');
    }
}
