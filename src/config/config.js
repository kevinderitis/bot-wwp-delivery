import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    SLACK_CHANNEL: process.env.SLACK_CHANNEL,
    FB_PIXEL_ID: process.env.FB_PIXEL_ID,
    FB_ACCESS_TOKEN: process.env.FB_ACCESS_TOKEN,
    API_KEY_TELEGRAM: process.env.API_KEY_TELEGRAM

};

export default config;
