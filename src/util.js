'use strict'

const _ = require('lodash')
const url = require('url')

module.exports = (options = {baseUrl: '/'}) => {
  function primaryKeyForModel (model) {
    return model.getIdName()
  }

  function pluralForModel (model) {
    return model.pluralModelName
  }

  function cleanUrl (urlString) {
    return url.format(url.parse(urlString))
  }

  function buildResourceLinks (data, model) {
    const pk = data[primaryKeyForModel(model)]
    const type = pluralForModel(model)
    const baseUrl = cleanUrl(options.baseUrl)
    return {self: `${baseUrl}${type}/${pk}`}
  }

  function buildRelationships (data, model) {
    const relationshipLinks = relationshipLinksFromData(data, model)
    const relationshipData = relationshipDataFromData(data, model)
    return _.merge(relationshipLinks, relationshipData)
  }

  function buildAttributes (data, model, opts = {}) {
    const attributeNames = attributesForModel(model, opts)
    return attributesFromData(data, attributeNames)
  }

  function relationshipLinksFromData (data, model) {
    const pk = data[primaryKeyForModel(model)]
    const type = pluralForModel(model)
    const relations = model.relations
    const baseUrl = cleanUrl(options.baseUrl)

    const relationships = {}
    for (let name of Object.keys(relations)) {
      relationships[name] = {links: {related: `${baseUrl}${type}/${pk}/${name}`}}
    }

    return relationships
  }

  function relatedModelFromRelation (relation) {
    if (!relation.polymorphic) {
      return relation.modelTo
    } else {
      // polymorphic
      // can't know up front what modelTo is.
      // need to do a lookup in the db using discriminator
      // const discriminator = relation.polymorphic.discriminator
      // const name = relation.name
    }
  }

  function relationshipDataFromData (data, model) {
    const relations = model.relations
    const relationships = {}
    for (let name of Object.keys(relations)) {
      const relation = relations[name]
      const relatedModel = relatedModelFromRelation(relation)
      if (relation.polymorphic) continue
      const pk = primaryKeyForModel(relatedModel)
      const type = pluralForModel(relatedModel)
      if (Array.isArray(data[name])) {
        relationships[name] = {data: []}
        for (let relatedData of data[name]) {
          relationships[name].data.push({type, id: relatedData[pk]})
        }
      } else if (data[name]) {
        relationships[name] = {data: {type, id: data[name][pk]}}
      }
    }
    return relationships
  }

  function attributesForModel (model, opts = {}) {
    const attributes = _.clone(model.definition.properties)
    if (opts.primaryKey === false) delete attributes[primaryKeyForModel(model)]
    if (opts.foreignKeys === false) {
      for (let foreignKey of foreignKeysForModel(model)) {
        delete attributes[foreignKey]
      }
    }
    return Object.keys(attributes)
  }

  function foreignKeysForModel (model) {
    const relations = model.relations
    const keys = []
    Object.keys(relations)
      .filter(relationName => relations[relationName].type === 'belongsTo')
      .forEach(relationName => {
        keys.push(relations[relationName].keyFrom)
        if (relations[relationName].polymorphic) {
          keys.push(relations[relationName].polymorphic.discriminator)
        }
      })
    return keys
  }

  function attributesFromData (data, attributes) {
    const obj = {}
    for (let attr of attributes) obj[attr] = data[attr]
    return obj
  }

  return {
    primaryKeyForModel,
    pluralForModel,
    buildResourceLinks,
    buildRelationships,
    buildAttributes,
    relationshipLinksFromData,
    relationshipDataFromData,
    attributesForModel,
    attributesFromData,
    foreignKeysForModel,
    relatedModelFromRelation
  }
}

