/* eslint-disable no-console, comma-dangle */
const request = require('request');
const { Future } = require('ramda-fantasy');
const { compose, evolve, filter, find, has, map, prop, propEq } = require('ramda');
const express = require('express');

const PORT = process.env.PORT || 3000;
const DATA_URL = 'https://github.com/powdahound/ec2instances.info/raw/master/www/instances.json';

const fetchData = () => Future((reject, resolve) =>
  request(DATA_URL, { json: true }, (err, response, body) => {
    if (err) { reject(err); }
    resolve(body);
  }));

fetchData().fork(
  err => console.error(err.message),
  (instances) => {
    const app = express();
    app.get('/', (req, res) => {
      res.send(`<h4># Simple EC2 Pricing API 🙏</h4>
        <ul>
          <li>- /instances</li>
          <li>- /instances/:instanceType</li>
          <li>- /regions/:region</li>
          <li>- /regions/:region/:instanceType</li>
        </ul>
      `);
    });

    app.get('/instances', (req, res) => {
      res.json(instances);
    });

    app.get('/instances/:instanceType', (req, res) => {
      const { instanceType } = req.params;
      const x = find(propEq('instance_type', instanceType), instances);
      if (x) {
        res.json(x);
      } else {
        res.status(404).json({ error: `Couldn't find ${instanceType}` });
      }
    });

    app.get('/regions/:region', (req, res) => {
      const { region } = req.params;

      const result = compose(
        filter(has('pricing')),
        map(evolve({
          pricing: prop(region)
        }))
      )(instances);

      res.json(result);
    });

    app.get('/regions/:region/:instanceType', (req, res) => {
      const { region, instanceType } = req.params;

      const result = compose(
        find(propEq('instance_type', instanceType)),
        filter(has('pricing')),
        map(evolve({
          pricing: prop(region)
        }))
      )(instances);

      res.json(result);
    });


    app.listen(PORT);

    console.log(`Listening on port ${PORT}`);
  }
);
