const Pool = require('pg').Pool;

const pool = new Pool({
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
});

const getOffers = (request, response) => {
    pool.query('SELECT * FROM job_offers WHERE is_junior_friendly = true ORDER BY offer_valid_date ASC', (error, results) => {
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

    pool.query('SELECT * FROM job_offers WHERE offer_link = $1', [link], (error, results) => {
        if (error) {
            console.log(error);
            response.status(500).send('Internal server error');
        }
        else {
            response.status(200).json(results.rows);
        }
    })

}

const createOffer = (request, response) => {
    const {
        link,
    } = { ...request.body };

    if (!link) throw new Error({
        code: 400,
        message: 'offer link is required'
    });

    pool.query('SELECT * FROM job_offers WHERE offer_link = $1', [link], (error, results) => {
        if (error) {
            response.status(500).send('Internal server error');
            return;
        }
        if (results && results.length > 0) {
            response.status(400).send('record with that link already exists');
            return;
        }
        const query = createOfferQueryConstructor(request.body);
        pool.query(query, (error, results) => {
            if (error) {
                console.log('error', error);
                response.status(500).send('Internal server error');
            }
            else {
                response.status(201).send('Created record')
            }
        })
    })
}

const createOfferQueryConstructor = (offer) => {
    const fields = [];
    const values = [];
    const {
        link,
        title,
        description,
        technologies,
        responsibilities,
        requirements,
        optionalRequirements,
        offerValidDate,
        isJuniorFriendly,
        noExperienceRequired,
    } = { ...offer };

    if (link) {
        fields.push('offer_link');
        values.push(`'${link}'`);
    }
    if (title) {
        fields.push('title');
        values.push(`'${title}'`);
    }
    if (description) {
        fields.push('description');
        values.push(`'${description}'`);
    }
    if (technologies && technologies.length > 0) {
        fields.push('technologies');
        values.push(`ARRAY [${[technologies.map(row => `'${row}'`)]}]`);
    }
    if (responsibilities && responsibilities.length > 0) {
        fields.push('responsibilities');
        values.push(`ARRAY [${[responsibilities.map(row => `'${row}'`)]}]`);
    }
    if (requirements && requirements.length > 0) {
        fields.push('requirements');
        values.push(`ARRAY [${[requirements.map(row => `'${row}'`)]}]`);
    }
    if (optionalRequirements && optionalRequirements.length > 0) {
        fields.push('optional_requirements');
        values.push(`ARRAY [${[optionalRequirements.map(row => `'${row}'`)]}]`);
    }
    if (isJuniorFriendly) {
        fields.push('is_junior_friendly');
        values.push(isJuniorFriendly);
    }
    if (noExperienceRequired) {
        fields.push('no_experience_required');
        values.push(noExperienceRequired);
    }
    if (offerValidDate) {
        fields.push('offer_valid_date');
        values.push(`'${offerValidDate}'::date`);
    }

    const queryString = `
    INSERT INTO job_offers(${[...fields]})
    VALUES (${[...values]});`

    return queryString;
}

module.exports = {
    getOfferByLink,
    createOffer,
    getOffers,
}