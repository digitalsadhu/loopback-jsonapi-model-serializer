'use strict'

const _ = require('lodash')
const url = require('url')

module.exports = (options = {baseUrl: '/'}) => {
  function generateIncluded (included = [], data, model) {
    const relations = model.relations

    _.forOwn(relations, (relationDefn, relationName) => {
      const relationModel = relatedModelFromRelation(relationDefn)
      const relationData = nestedRelationData(relationName, data)
      const jsonapi = buildJsonapi(relationModel, relationData)
      included.push(jsonapi)
      generateIncluded(included, relationData, relationModel)
    })
  }

  function nestedRelationData (relationName, data) {

  }

  function primaryKeyForModel (model) {
    return model.getIdName()
  }

  function pluralForModel (model) {
    return model.pluralModelName
  }

  function buildJsonapi (data, model) {
    const pk = primaryKeyForModel(model)
    const id = data[pk]
    delete attributes[pk]
    const type = pluralForModel(model)
    const attributes = buildAttributes(data, model)
    const relationships = buildRelationships(data, model)
    const links = buildResourceLinks(data, model)

    // TODO: use options to decide whether to delete fks as well
    return formatJsonapi(id, type, attributes, relationships, links)
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
    // const relationshipNames = relationshipsForModel(model)
    const relationshipLinks = relationshipLinksFromData(data, model)
    // const relationshipData = relationshipDataFromData(data, model)
    return relationshipLinks
    // return _.merge([relationshipLinks, relationshipData])
  }

  function buildAttributes (data, model, opts = {}) {
    const attributeNames = attributesForModel(model, opts)
    return attributesFromData(data, attributeNames)
  }

  function relationshipsForModel (model) {

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

  function formatJsonapi (id, type, attributes, relationships, links, meta) {
    let data = {id, type}
    if (attributes) data = Object.assign(data, {attributes})
    if (relationships) data = Object.assign(data, {relationships})
    if (links) data = Object.assign(data, {links})
    if (meta) data = Object.assign(data, {meta})
    return data
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
    generateIncluded,
    nestedRelationData,
    primaryKeyForModel, // done
    pluralForModel, // done
    buildJsonapi,
    buildResourceLinks, // done
    buildRelationships,
    buildAttributes, // done
    relationshipsForModel,
    relationshipLinksFromData, // done
    relationshipDataFromData, // done
    formatJsonapi, // done
    attributesForModel, // done
    attributesFromData, // done
    foreignKeysForModel, // done
    relatedModelFromRelation // done
  }
}

