# loopback-jsonapi-model-serializer

JSONAPI Model serializer for loopback

[![NPM](https://nodei.co/npm/loopback-jsonapi-model-serializer.png?downloads=true&stars=true)](https://nodei.co/npm/loopback-jsonapi-model-serializer/)

[![Media Suite](http://mediasuite.co.nz/ms-badge.png)](http://mediasuite.co.nz)

[![Build Status](https://travis-ci.org/mediasuitenz/loopback-jsonapi-model-serializer.svg)](https://travis-ci.org/digitalsadhu/loopback-jsonapi-model-serializer)

## Installation

```
npm install loopback-jsonapi-model-serializer --save
```

## Basic Usage

Include the module as a dependency
```js
const serializer = require('loopback-jsonapi-model-serializer')
```

Use it to serialize a data payload
```js
const serializedData = serializer.serialize(data, model)
```

## API

```js
serialize(data, model, [options])
```

- `data` a payload of data from a loopback find, findOne, findById etc.
- `model` a loopback model eg. app.models.User
- `options` used to override baseUrl used in serialization process {baseUrl: 'http://localhost:3000/'}
