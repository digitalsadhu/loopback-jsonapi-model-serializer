import test from 'ava'
import loopback from 'loopback'
import util from '../src/util'

test.beforeEach(t => {
  const app = t.context.app = loopback()
  app.set('legacyExplorer', false)

  const ds = loopback.createDataSource('memory')

  const Post = ds.createModel('post', {title: String, content: String})
  const Author = ds.createModel('author', {name: String, email: String})
  const Comment = ds.createModel('comment', {title: String, comment: String})
  const Parent = ds.createModel('parent', {name: String})
  const Critic = ds.createModel('critic', {name: String})
  const Appointment = ds.createModel('appointment', {name: String})
  const Physician = ds.createModel('physician', {name: String})
  const Patient = ds.createModel('patient', {name: String})
  const House = ds.createModel('house', {name: String})
  const Door = ds.createModel('door', {name: String})
  const Window = ds.createModel('window', {name: String})
  const Tile = ds.createModel('tile', {name: String})
  const Floor = ds.createModel('floor', {name: String})

  app.model(Post)
  app.model(Author)
  app.model(Comment)
  app.model(Parent)
  app.model(Critic)
  app.model(Appointment)
  app.model(Physician)
  app.model(Patient)
  app.model(House)
  app.model(Door)
  app.model(Window)
  app.model(Tile)
  app.model(Floor)

  Comment.belongsTo(Post)
  Post.hasMany(Comment)
  Post.belongsTo(Author)
  Parent.hasMany(Post, {polymorphic: {discriminator: 'parentType', foreignKey: 'parentId'}})
  Post.belongsTo('parent', {polymorphic: true})
  Post.hasAndBelongsToMany(Critic)
  Author.hasMany(Post)
  Author.hasMany(Comment, {through: Post})
  House.embedsOne(Door)
  House.embedsMany(Window)
  House.referencesMany(Tile)
  House.hasOne(Floor)
  Appointment.belongsTo(Patient)
  Appointment.belongsTo(Physician)
  Physician.hasMany(Patient, {through: Appointment})
  Patient.hasMany(Physician, {through: Appointment})

  app.use(loopback.rest())
})

test('pluralForModel', t => {
  t.plan(2)
  const { Post, Comment } = t.context.app.models

  const postPlural = util().pluralForModel(Post)
  const commentPlural = util().pluralForModel(Comment)

  t.is(postPlural, 'posts', 'post plural should be posts')
  t.is(commentPlural, 'comments', 'comment plural should be comments')
})

test('primaryKeyForModel', t => {
  t.plan(2)
  const { Post, Comment } = t.context.app.models

  const postPrimaryKey = util().primaryKeyForModel(Post)
  const commentPrimaryKey = util().primaryKeyForModel(Comment)

  t.is(postPrimaryKey, 'id', 'post primary key should be id')
  t.is(commentPrimaryKey, 'id', 'comment primary key should be id')
})

test('attributesFromData', t => {
  t.plan(1)
  const data = {id: 1, title: 'my title', other: 'other stuff'}
  const attributeNames = ['id', 'title']

  const attributes = util().attributesFromData(data, attributeNames)

  t.deepEqual(attributes, {id: 1, title: 'my title'}, `should match ${JSON.stringify({id: 1, title: 'my title'})}`)
})

test('attributesForModel', t => {
  t.plan(1)
  const { Post } = t.context.app.models

  const attributes = util().attributesForModel(Post)

  const expected = ['title', 'content', 'id', 'authorId', 'parentType', 'parentId']
  t.deepEqual(attributes, expected, `should match ${JSON.stringify(expected)}`)
})

test('attributesForModel option: primaryKey: false', t => {
  t.plan(1)
  const { Post } = t.context.app.models

  const attributes = util().attributesForModel(Post, {primaryKey: false})

  const expected = ['title', 'content', 'authorId', 'parentType', 'parentId']
  t.deepEqual(attributes, expected, `should match ${JSON.stringify(expected)}`)
})

test('attributesForModel option: foreignKeys: false', t => {
  t.plan(1)
  const { Post } = t.context.app.models

  const attributes = util().attributesForModel(Post, {foreignKeys: false})

  t.deepEqual(attributes, ['title', 'content', 'id'],
    `attributes should match ${JSON.stringify(['id', 'title', 'content'])}`)
})

test('foreignKeysForModel', t => {
  t.plan(1)
  const { Post } = t.context.app.models

  const foreignkeys = util().foreignKeysForModel(Post)

  const expected = ['authorId', 'parentId', 'parentType']
  t.deepEqual(foreignkeys, expected, `should match ${JSON.stringify(expected)}`)
})

test('buildAttributes', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom', parentId: 1, parentType: 'parent'}

  const attributes = util().buildAttributes(data, Post)

  const expected = {id: 1, authorId: 1, title: data.title, content: data.content, parentId: 1, parentType: 'parent'}
  t.deepEqual(attributes, expected, `should match ${JSON.stringify(expected)}`)
})

test('buildAttributes options: primaryKey: false', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom', parentId: 1, parentType: 'parent'}

  const attributes = util().buildAttributes(data, Post, {primaryKey: false})

  const expected = {authorId: 1, title: data.title, content: data.content, parentId: 1, parentType: 'parent'}
  t.deepEqual(attributes, expected, `should match ${JSON.stringify(expected)}`)
})

test('buildAttributes options: primaryKey: false, foreignKeys: false', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom'}

  const attributes = util().buildAttributes(data, Post, {primaryKey: false, foreignKeys: false})

  const expected = {title: data.title, content: data.content}
  t.deepEqual(attributes, expected, `should match ${JSON.stringify(expected)}`)
})

test('buildResourceLinks', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom'}
  const options = {baseUrl: 'http://posts.com/'}

  const links = util(options).buildResourceLinks(data, Post)

  const expected = {self: 'http://posts.com/posts/1'}
  t.deepEqual(links, expected, `should match ${JSON.stringify(expected)}`)
})

test('relationshipLinksFromData', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1}

  const links = util().relationshipLinksFromData(data, Post)

  const expected = {
    comments: {
      links: {
        related: '/posts/1/comments'
      }
    },
    author: {
      links: {
        related: '/posts/1/author'
      }
    },
    parent: {
      links: {
        related: '/posts/1/parent'
      }
    },
    critics: {
      links: {
        related: '/posts/1/critics'
      }
    }
  }
  t.deepEqual(links, expected, `should match ${JSON.stringify(expected)}`)
})

test('relationshipDataFromData', t => {
  t.plan(1)
  const { Author } = t.context.app.models
  const data = {id: 1, posts: [
    {id: 1, name: 'my name 1'},
    {id: 2, name: 'my name 2'},
    {id: 3, name: 'my name 3'}
  ]}

  const links = util().relationshipDataFromData(data, Author)

  const expected = {
    posts: {
      data: [
        {id: 1, type: 'posts'},
        {id: 2, type: 'posts'},
        {id: 3, type: 'posts'}
      ]
    }
  }
  t.deepEqual(links, expected, `should match ${JSON.stringify(expected)}`)
})

test('relationshipDataFromData no included data', t => {
  t.plan(1)
  const { Author } = t.context.app.models
  const data = {id: 1}

  const links = util().relationshipDataFromData(data, Author)

  const expected = {}
  t.deepEqual(links, expected, `should match ${JSON.stringify(expected)}`)
})

test('relationshipDataFromData singular relation', t => {
  t.plan(1)
  const { Appointment } = t.context.app.models
  const data = {id: 1, patient: {id: 1, name: 'my name 1'}}

  const links = util().relationshipDataFromData(data, Appointment)

  const expected = {patient: {data: {id: 1, type: 'patients'}}}
  t.deepEqual(links, expected, `should match ${JSON.stringify(expected)}`)
})

test('relatedModelFromRelation post.comments', t => {
  const { Post } = t.context.app.models
  const relation = Post.relations.comments
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'comments', 'should equal `comment`')
})

test('relatedModelFromRelation post.author', t => {
  const { Post } = t.context.app.models
  const relation = Post.relations.author
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'authors', 'should equal `authors`')
})

test('relatedModelFromRelation post.critics', t => {
  const { Post } = t.context.app.models
  const relation = Post.relations.critics
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'critics', 'should equal `critics`')
})

test('relatedModelFromRelation House embedsOne Door', t => {
  const { House } = t.context.app.models
  const relation = House.relations.doorItem
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'doors', 'should equal `doors`')
})

test('relatedModelFromRelation House embedsMany Window', t => {
  const { House } = t.context.app.models
  const relation = House.relations.windowList
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'windows', 'should equal `windows`')
})

test('relatedModelFromRelation House referencesMany Tile', t => {
  const { House } = t.context.app.models
  const relation = House.relations.tiles
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'tiles', 'should equal `tiles`')
})

test('relatedModelFromRelation House hasOne Floor', t => {
  const { House } = t.context.app.models
  const relation = House.relations.floor
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'floors', 'should equal `floors`')
})

test('relatedModelFromRelation Physician hasMany Patient through Appointment', t => {
  const { Physician } = t.context.app.models
  const relation = Physician.relations.patients
  const lib = util()

  const model = lib.relatedModelFromRelation(relation)

  t.is(lib.pluralForModel(model), 'patients', 'should equal `patients`')
})

test('buildRelations', t => {
  t.plan(1)
  const { Author } = t.context.app.models
  const data = {id: 1, posts: [{id: 1}, {id: 2}, {id: 3}]}
  const opts = {baseUrl: 'http://locahost:3000'}

  const rels = util(opts).buildRelationships(data, Author)

  const expected = {
    posts: {
      links: {
        related: 'http://locahost:3000/authors/1/posts'
      },
      data: [
        {id: 1, type: 'posts'},
        {id: 2, type: 'posts'},
        {id: 3, type: 'posts'}
      ]
    },
    comments: {
      links: {
        related: 'http://locahost:3000/authors/1/comments'
      }
    }
  }

  t.deepEqual(rels, expected, `should match ${JSON.stringify(expected)}`)
})

