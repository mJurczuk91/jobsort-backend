const Pool = require('pg').Pool;

const pool = new Pool({
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
});

const getOffers = (request, response) => {
    pool.query('SELECT * FROM job_offers  WHERE offer_valid_date > CURRENT_DATE+1 ORDER BY offer_valid_date DESC', (error, results) => {
        if (error) {
            throw new Error({
                code: 500,
                message: 'something went wrong',
            })
        }
        response.status(200).json(results.rows);
    })
}

const getOfferByLink = (request, response) => {
    const { link } = { ...request.body };

    if (!link) {
        throw new Error({
            code: 400,
            message: 'offer link is required'
        })
    }

    pool.query('SELECT * FROM job_offers WHERE offer_url = $1', [link], (error, results) => {
        if (error) {
            console.log(error);
            response.status(500).send('Internal server error');
        }
        else {
            response.status(200).json(results.rows);
        }
    })

}

const createOffer = async (request, response) => {
    const offer = { ...request.body };
    for (let requiredField of [
        'url',
        'description',
        'technologies',
        'offerValidDate',
        'isJuniorFriendly',
        'noExperienceRequired',
    ]) {
        if (offer[requiredField] === undefined) {
            if (offer.url) {
                response.status(400).send(`failed to create record for ${offer.link}, ${requiredField} is undefined`);
                return;
            } else {
                response.status(400).send(`failed to create record for offer with undefined link, offer data: ${JSON.stringify(offer)}`);
                return;
            }
        }
    }

    const exists = await pool.query('SELECT * FROM job_offers WHERE offer_url = $1', [offer.url]);
    if(exists && exists.rowCount > 0){
        response.status(400).send('record with that url already exists');
        return;
    }

    const queryText = 'INSERT INTO job_offers(offer_url, description, technologies, offer_valid_date, is_junior_friendly, no_experience_required) VALUES ($1, $2, $3, $4, $5, $6)';
    const queryValues = [
        offer.url,
        offer.description,
        offer.technologies,
        offer.offerValidDate,
        offer.isJuniorFriendly,
        offer.noExperienceRequired,
    ];

    try{
        await pool.query(queryText, queryValues);
    } catch(e) {
        console.log('ERROR CREATING AN OFFER RECORD');
        for(let key of Object.keys(e)){
            console.log(key, e[key]);
        }
        response.status(400).send('Failed to create record');
        return;
    }

    response.status(200).send();
    return;
}

module.exports = {
    getOfferByLink,
    createOffer,
    getOffers,
}