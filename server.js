import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { getTournaments, fetchOfficial, scrapeMetrix } from './scrapeTournaments.js';
import { handleCache } from './scrapeStores.js';
import { getRatings } from './scrapeRating.js';

dotenv.config();

const app = express();

if (process.env.NODE_ENV === 'production') {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigin.indexOf(origin) === -1) {
        var msg = `The CORS policy for this site does not allow access from origin ${origin}.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }
  }));
} else {
  app.use(cors({ origin: '*' }));
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: err.message });
});


app.get('/tournaments', async (req, res, next) => getTournaments('official', fetchOfficial)(req, res, next));

app.get('/tournaments/metrix', async (req, res, next) => getTournaments('metrix', scrapeMetrix)(req, res, next));

app.get('/bagtag', async (req, res, next) => {
  try {
    const response = await fetch(process.env.BAGTAG_ENDPOINT);
    const body = await response.json();
    res.json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occured' });
  }
})

app.get('/products/:type/:query', async (req, res, next) => {
  const { type, query } = req.params;
  try {
    const data = await handleCache(type, query)
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occured' });
  }
});

app.get('/ratings', async (req, res, next) => {
  try {
    const data = await getRatings()
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occured' });
  }
});

app.listen(process.env.PORT || 8080, () => console.log(`Server has started on http://localhost:${process.env.PORT || 8080}`));
