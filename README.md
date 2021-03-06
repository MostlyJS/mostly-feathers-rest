MostlyJS Feathers Handler
=========================

[![Build Status](https://travis-ci.org/mostlyjs/mostly-feathers-rest.svg)](https://travis-ci.org/mostlyjs/mostly-feathers-rest)

This module provides an express middleware as a RESTful gateway to call microservice writing with [mostly-feathers](https://github.com/MostlyJS/mostly-feathers).

# Documentation

Please see the [documentation site](https://mostlyjs.github.io).

# Usage

## Installation

```bash
npm install mostly-feathers-rest
```

## Quick Example

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const nats = require('nats');
const mostly = require('mostly-node');
const feathers = require('mostly-feathers-rest');

const trans = new mostly(nats.connect()
const app = express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }));

trans.ready(() => {
  app.use(feathers(app, trans, '/api'));
  app.listen(process.env.PORT || 3001);
});
```

# License

MIT