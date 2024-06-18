import axios from 'axios';
import crypto from 'crypto';
import config from '../config/config.js';

const sha256Hash = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

const sendContactEventToFacebook = async (phoneNumber) => {
  try {
    const pixelId = config.FB_PIXEL_ID; 
    const accessToken = config.FB_ACCESS_TOKEN; 

    const hashedPhoneNumber = sha256Hash(phoneNumber);

    const requestBody = {
      data: [
        {
          event_name: 'Contact',
          event_time: Math.floor(Date.now() / 1000), 
          user_data: {
            ph: hashedPhoneNumber, 
          },
          custom_data: {
            action: 'Contacto a través de teléfono',
          },
        },
      ],
      access_token: accessToken,
    };

    const response = await axios.post(`https://graph.facebook.com/v12.0/${pixelId}/events`, requestBody);

    console.log('Evento enviado exitosamente:', response.data);
  } catch (error) {
    console.error('Error al enviar el evento a Facebook:', error.message);
    throw new Error('No se pudo enviar el evento a Facebook');
  }
};

export default sendContactEventToFacebook;
