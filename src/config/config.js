import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    SLACK_CHANNEL: process.env.SLACK_CHANNEL

};

export default config;
