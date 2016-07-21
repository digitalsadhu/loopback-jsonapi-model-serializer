# loopback-jsonapi-model-serializer

JSONAPI Model serializer for loopback

[![NPM](https://nodei.co/npm/loopback-jsonapi-model-serializer.png?downloads=true&stars=true)](https://nodei.co/npm/loopback-jsonapi-model-serializer/)

[![Media Suite](https://mediasuite.co.nz/ms-badge.png)](https://mediasuite.co.nz)

[![Build Status](https://travis-ci.org/digitalsadhu/loopback-jsonapi-model-serializer.svg?branch=master)](https://travis-ci.org/digitalsadhu/loopback-jsonapi-model-serializer)

## About

The goal of this project is to provide a simple [JSONAPI](http://jsonapi.org/) serialization tool for loopback models.
You should be able to use (for example) loopbacks PersistedModel.find() method with all its various filter options
and pass the returned data (along with the model) into the serializer and have all the intricacies of
the JSON APi serialization process taken care of for you. See the example section below.

## Installation

```
npm install loopback-jsonapi-model-serializer --save
```

## Basic Usage

Include the module as a dependency
```js
const serialize = require('loopback-jsonapi-model-serializer')
```

Use it to serialize a data payload
```js
const serializedData = serialize(data, model)
```

You will almost certainly want to override baseUrl so that the serializer can prepend
urls as neeeded.

```
const serializedData = serialize(data, model, {baseUrl: 'http://myapi.com/api/'})
```

## API

```js
serialize(data, model, [options])
```

- `data` a payload of data from a loopback find, findOne, findById etc.
- `model` a loopback model eg. app.models.User
- `options` used to override baseUrl used in serialization process {baseUrl: 'http://localhost:3000/'}

## Example

Given the following loopback models and relationships:

```
const Post = ds.createModel('post', {title: String})
const Comment = ds.createModel('comment', {title: String})
const Author = ds.createModel('author', {name: String})

app.model(Post)
app.model(Author)
app.model(Comment)

Post.hasMany(Comment)
Post.belongsTo(Author)
```

We can perform the folliowing query:

```
Post.find().then(data => {...})
```

Then we serialize the returned data like so:

```
const serializedData = serialize(data, Post)
```

After which `serializedData` should look something like:

```
{
  "data": [
    {
      "id": 1,
      "type": "posts",
      "links": {
        "self": "/posts/1"
      },
      "attributes": {
        "title": "post 0"
      },
      "relationships": {
        "comments": {
          "links": {
            "related": "/posts/1/comments"
          }
        },
        "author": {
          "links": {
            "related": "/posts/1/author"
          }
        }
      }
    }
  ]
}
```

## Loopback relations

### Without fetching included models

When you give the serializer data that does not have any included relationships,
The serializer will construct urls that allow consuming clients to fetch related
data with an additional query.

In our example above, `Post` has Many `Comment` and belongsTo `Author`. The serializer
will construct the following:

```
"relationships": {
  "comments": {
    "links": {
      "related": "/posts/1/comments"
    }
  },
  "author": {
    "links": {
      "related": "/posts/1/author"
    }
  }
}
```

Clients can then use these urls to fetch related data as per the [JSONAPI spec](http://jsonapi.org/)

### Fetching included models

You can use loopbacks include syntax to fetch related data in a single request.
These 'side loaded' relations will be handled according to the [JSONAPI spec](http://jsonapi.org/),
serialized, placed in the `included` block and linked to via the `relationships` `data` object.

#### Fetching in loopback with relations

```
Post.find({include: ['author', 'comments']}).then(data => {
  const serialized = serialize(data, Post)
})
```

#### Linking in the relationships `data` object

When relationship data is included, `id` and `type` linkages are made
in the relationships object under the appropriate relationships

```
"relationships": {
  "comments": {
    "links": {
      "related": "/posts/1/comments"
    },
    "data": [
      {"id": 1, "type": "comments"},
      {"id": 2, "type": "comments"}
    ]
  },
  "author": {
    "links": {
      "related": "/posts/1/author"
    },
    "data": {"id": 1, "type": "authors"}
  }
}
```

#### Linked resources included in the `included` array

When relationship data is included, related `authors` and `comments` will be serialized
and placed in an array under the key `included`. See the [JSONAPI spec](http://jsonapi.org/) for more
information.

```
{
  "data": [...],
  "included": [
    {"id": 1, "type": "comments", "attributes": {}, etc},
    {"id": 1, "type": "authors", "attributes": {}, etc},
    etc.
  ]
}
```

## Other information

You can also make good sense of the serialization process by reading through the tests.