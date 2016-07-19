const serializer = require('./serializer')

module.exports = (data, model, options = {baseUrl: '/'}) => {
  return serializer(options).serialize(data, model)
}
