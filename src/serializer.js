'use strict'

const lib = require('./util')
const _ = require('lodash')

module.exports = (options = {baseUrl: '/'}) => {
  function serialize (data, model) {
    let serializedData = []
    let serializedIncluded = new Map()
    if (Array.isArray(data)) {
      for (let dataPoint of data) {
        serializedData.push(resource(dataPoint, model))
        included(dataPoint, model).forEach(item => {
          serializedIncluded.set(`${item.type}-${item.id}`, item)
        })
      }
    } else {
      serializedData = resource(data, model)
      serializedIncluded = included(data, model)
    }
    const serialized = {data: serializedData}
    if (serializedIncluded.size > 0) serialized.included = [...serializedIncluded.values()]

    return serialized
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
    let incl = new Map()
    const relations = model.relations
    for (let name of Object.keys(relations)) {
      const relation = relations[name]
      if (relation.polymorphic) continue
      const model = lib().relatedModelFromRelation(relation)
      let relatedData = data[name] || []
      if (!model) return incl
      if (!Array.isArray(relatedData)) relatedData = [relatedData]
      for (let relatedDataPoint of relatedData) {
        const item = resource(relatedDataPoint, model)
        incl.set(`${item.type}-${item.id}`, item)
        included(relatedDataPoint, model).forEach(item => {
          incl.set(`${item.type}-${item.id}`, item)
        })
      }
    }
    return incl
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
