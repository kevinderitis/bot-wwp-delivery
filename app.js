import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
import moment from 'moment-timezone';
import { createLeadService, createResponse, formatNumber, getLeads } from './src/services/leadServices.js';
import ejs from 'ejs';
import { getLeadByChatId, updateLeadByChatId, updateLeadById } from './src/dao/leadDAO.js';
import { getNextClient } from './src/services/clientServices.js';
import { sendSlackMessage } from './src/services/slackServices.js';
import sendContactEventToFacebook from './src/services/facebookServices.js';

const { Client, MessageMedia } = pkg;

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

let qrData;

app.get('/qr', async (req, res) => {
    const data = qrData;

    try {
        const qrText = data;
        res.render('qr-code', { qrText });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating QR code');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

let client = new Client({
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        // executablePath: process.env.CHROME_BIN || null
    },
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
});

let lastMessageChatId = "";

const welcomeText = `¡Hola! 👋 ¿Estas listo para jugar? Para darte la mejor atención, tenés un cajero personal para hablar con vos. Acá te envío el numero. ¡Mucha suerte! 🍀`;

const sendWelcomeMessage = async (myClient, chatId) => {
    try {
        let clientData;
        let lead = await getLeadByChatId(chatId);
        if (lead && lead.status === 'pending') {
            clientData = await getNextClient();
            await updateLeadByChatId(chatId, 'sent', clientData.phoneNumber);
            await myClient.sendMessage(chatId, welcomeText);
            lastMessageChatId = chatId;
            console.log(`Lead ${lead.chatId} enviado a: ${clientData.phoneNumber}`)
        }
        return clientData;
    } catch (error) {
        throw error;
    }
};

const sendContact = async (myClient, chatId) => {
    try {
        let lead = await getLeadByChatId(chatId);
        if (lead) {
            let formatedNumber = formatNumber(lead.clientPhone);
            const contact = await myClient.getContactById(formatedNumber);
            await myClient.sendMessage(chatId, contact);
        }
    } catch (error) {
        throw error;
    }
};

const sendLeadToClient = async (myClient, clientPhone, chatId) => {
    try {
        const lead = await myClient.getContactById(chatId);
        let clientPhoneFormated = formatNumber(clientPhone);
        await myClient.sendMessage(clientPhoneFormated, lead);
    } catch (error) {
        console.log(error);
    }
};

const initializeClient = () => {
    client.on('qr', async (qr) => {
        qrData = qr;
        console.log(`Este es la data de qr: ${qrData}`);
        try {
            await sendSlackMessage(`Server caido, leer nuevamente qr.`);
        } catch (error) {
            console.log(error);
        }

    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('disconnected', async (reason) => {
        console.log('Cliente desconectado:', reason);
        const myNumber = client.info.wid._serialized;
        try {
            if (reason === 'TOS_BLOCK' || reason === 'SMB_TOS_BLOCK') {
                await sendSlackMessage(`Numero ${myNumber} bloqueado!`);
            } else {
                await sendSlackMessage(`Numero ${myNumber} desconectado!`);
            }
        } catch (error) {
            console.log(error);
        }


    });

    client.on('message', async (msg) => {
        try {
            let chatId = msg.from;
            console.log(`Se recibio mensaje de ${chatId}`);
            if (lastMessageChatId === chatId) {
                console.log("Ya se envió un mensaje a este número anteriormente. Evitando enviar otro.");
                return;
            } else {
                let lead = await createLeadService(chatId);
                if (lead) {
                    let clientData = await sendWelcomeMessage(client, chatId);
                    await sendContact(client, chatId);
                    // await sendContactEventToFacebook(chatId);
                    // await sendLeadToClient(client, clientData.phoneNumber, chatId);
                }
            }
        } catch (error) {
            console.error("Error al procesar el mensaje:", error);
        }
    });

    client.initialize();
};

initializeClient();

app.get('/shutdown', async (req, res) => {
    try {
        await client.destroy();
        console.log('Client has been shut down');
        client = new Client({
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            },
            webVersionCache: {
                type: "remote",
                remotePath:
                    "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
            }
        });
        initializeClient();
        console.log('Client has been restarted');
        res.send('Client has been restarted');
    } catch (error) {
        console.error('Error shutting down client:', error);
        res.status(500).send('Error shutting down client');
    }
});

app.get('/leads', async (req, res) => {
    let filter = req.query ? req.query.filter : '';
    try {
        let leads = await getLeads(filter);
        res.render('leads-view', { leads });
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get('/leads/all', async (req, res) => {
    try {
        let leads = await getLeads();

        let mappedLeads = leads.map(lead => ({
            chatId: lead.chatId,
            status: lead.status,
            clientPhone: lead.clientPhone,
            createdAt: moment.utc(lead.createdAt).tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD HH:mm:ss')
        }));

        res.send(mappedLeads);
    } catch (error) {
        res.status(500).send(error);
    }
})