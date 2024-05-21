const configDotenv = require('dotenv').configDotenv;
configDotenv();

const {getOfferByLink, createOffer, getOffers} = require('./db');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const port = 3010;

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
    const key = req.get('key');
    const key_local = process.env.AUTH_KEY;
    if (!key_local) {
        throw new Error(JSON.stringify({
            code: 500,
            message: 'Local api key not defined',
        }));
    };
    if (!key || key !== key_local) {
        throw new Error(JSON.stringify({
            code: 403,
            message: 'Auth passport mismatch',
        }));
    };
    next();
});

app.use((err, req, res, next) => {
    try {
        const { message, code } = { ...JSON.parse(err.message) }
        console.error('Error:', message);
        res.status(code).send(message);
    } catch (e) {
        console.log(e);
        res.status(500).send('Something went wrong')
    }
});


app.post('/offerByLink', getOfferByLink);
app.get('/offers', getOffers);
app.post('/offer', createOffer);

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})