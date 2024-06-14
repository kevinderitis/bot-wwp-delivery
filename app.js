import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
import { createResponse } from './src/services/leadServices.js';
import ejs from 'ejs';

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


const sendMessageClient = async (myClient, chatId) => {
    try {
        if (lastMessageChatId === chatId) {
            console.log("Ya se envió un mensaje a este número anteriormente. Evitando enviar otro.");
            return;
        } else {
            let response = await createResponse(chatId);
            const contact = await myClient.getContactById(response.formated);

            await myClient.sendMessage(chatId, response.text);
            lastMessageChatId = chatId;

            setTimeout(async () => {
                try {
                    await myClient.sendMessage(chatId, contact);
                } catch (error) {
                    console.error("Error al enviar el contacto:", error);
                }
            }, 2000);
        }
    } catch (error) {
        throw error;
    }
};

const initializeClient = () => {
    client.on('qr', (qr) => {
        qrData = qr;
        console.log(`Este es la data de qr: ${qrData}`);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', async (msg) => {
        try {
            let chatId = msg.from;
            await sendMessageClient(client, chatId);
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
