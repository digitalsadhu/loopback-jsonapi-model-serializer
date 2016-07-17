'use strict'

const lib = require('./index.js')
const _ = require('lodash')

module.exports = (options = {baseUrl: '/'}) => {
  function serialize (data, model) {

  }

  function resource (data, model) {
    const resource = {
      id: id(data, model),
      type: type(data, model),
      links: links(data, model)
    }

    const attrs = attributes(data, model)
    if (!_.isEmpty(attrs)) resource['attributes'] = attrs

    const rels = relationships(data, model)
    if (!_.isEmpty(rels)) resource['relationships'] = rels

    return resource
  }

  function id (data, model) {
    return data[lib().primaryKeyForModel(model)]
  }

  function type (data, model) {
    return lib().pluralForModel(model)
  }

  function attributes (data, model) {
    const opts = _.assign({primaryKey: false, foreignKeys: false}, options)
    return lib().buildAttributes(data, model, opts)
  }

  function links (data, model) {
    return lib(options).buildResourceLinks(data, model)
  }

  function relationships (data, model) {
    return lib(options).buildRelationships(data, model)
  }

  function included (data, model) {

  }

  return {
    serialize,
    resource,
    id,
    type,
    attributes,
    links,
    relationships,
    included
  }
}
