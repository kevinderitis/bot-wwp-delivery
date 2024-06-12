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
            text = 'Veo que ya te comunicaste anteriormente. Te envio el contacto de tu cajero para que te pongas en contacto con el';
        } else {
            let clientData = await getNextClient();
            await createLeadService(chatId, clientData.phoneNumber);
            number = clientData.phoneNumber;
            text = 'Buenas! te paso el contacto de tu cajero oficial asignado. Escribile ahora para generar el usuario y empezar a jugar.';
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