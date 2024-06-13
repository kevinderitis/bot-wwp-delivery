import { getLeadByChatId, createLead } from "../dao/leadDAO.js";
import { getNextClient } from "./clientServices.js";


const formatNumber = number => {
    return `${number}@c.us`;
}

export const createResponse = async chatId => {
    let number;
    let response;
    let text;
    try {
        let lead = await getLeadByChatId(chatId);
        if (lead) {
            number = lead.clientPhone;
            text = 'Veo que ya te comunicaste anteriormente. Te envio el contacto de tu cajero para que te pongas en contacto.';
        } else {
            let clientData = await getNextClient();
            await createLeadService(chatId, clientData.phoneNumber);
            number = clientData.phoneNumber;
            text = `¡Hola! 👋 ¿Estas listo para jugar? Para darte la mejor atención, tenés un cajero personal para hablar con vos. Acá te envío el numero. ¡Mucha suerte! 🍀`;
        }

        response = {
            formated: formatNumber(number),
            number,
            text
        };

        return response;
    } catch (error) {
        console.log(error)
        number = 'Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente más tarde.';
        return number;
    }

}

export const createLeadService = async (chatId, clientPhone) => {
    try {
        let newLead = await createLead(chatId, clientPhone);
        return newLead;
    } catch (error) {
        console.log(error)
    }
}