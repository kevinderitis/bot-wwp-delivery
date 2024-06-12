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

const initializeClient = () => {
    client.on('qr', (qr) => {
        qrData = qr;
        console.log(`Este es la data de qr: ${qrData}`);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', async msg => {
        let chatId = msg.from;
        let response = await createResponse(chatId);
        const contact = await client.getContactById(response.formated);

        client.sendMessage(chatId, response.text);
        setTimeout(async () => {
            await client.sendMessage(chatId, contact);
        }, 2000);

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
