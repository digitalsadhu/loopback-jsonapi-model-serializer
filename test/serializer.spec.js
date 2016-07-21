import test from 'ava'
import loopback from 'loopback'
import serializer from '../src/serializer'

test.beforeEach(t => {
  const app = t.context.app = loopback()
  app.set('legacyExplorer', false)

  const ds = loopback.createDataSource('memory')

  const Post = ds.createModel('post', {title: String, content: String})
  const Author = ds.createModel('author', {name: String, email: String})
  const Comment = ds.createModel('comment', {title: String, comment: String})
  const Parent = ds.createModel('parent', {name: String})
  const Critic = ds.createModel('critic', {name: String})
  const Empty = ds.createModel('empty', {})

  app.model(Post)
  app.model(Author)
  app.model(Comment)
  app.model(Parent)
  app.model(Critic)
  app.model(Empty)

  Comment.belongsTo(Post)
  Post.hasMany(Comment)
  Post.belongsTo(Author)
  Post.belongsTo('parent', {polymorphic: true})
  Post.hasAndBelongsToMany(Critic)
  Author.hasMany(Post)
  Author.hasMany(Comment, {through: Post})

  app.use(loopback.rest())
})

test('id', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom'}

  const id = serializer().id(data, Post)

  const expected = 1
  t.deepEqual(id, expected, `serialized should match ${expected}`)
})

test('type', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {}

  const type = serializer().type(data, Post)

  const expected = 'posts'
  t.deepEqual(type, expected, `serialized should match ${expected}`)
})

test('attributes', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom'}

  const attributes = serializer().attributes(data, Post)

  const expected = {title: 'my title', content: 'my content'}
  t.deepEqual(attributes, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('attributes keeping foreign keys', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom', parentId: 1, parentType: 'parent'}

  const attributes = serializer({foreignKeys: true}).attributes(data, Post)

  const expected = {title: 'my title', content: 'my content', authorId: 1, parentId: 1, parentType: 'parent'}
  t.deepEqual(attributes, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('attributes keeping primary key', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, authorId: 1, title: 'my title', content: 'my content', other: 'custom'}

  const attributes = serializer({primaryKey: true}).attributes(data, Post)

  const expected = {id: 1, title: 'my title', content: 'my content'}
  t.deepEqual(attributes, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('resource miminal', t => {
  t.plan(1)
  const { Empty } = t.context.app.models
  const data = {id: 1, other: 'custom'}

  const resource = serializer().resource(data, Empty)

  const expected = {id: 1, type: 'empties', links: {self: '/empties/1'}}
  t.deepEqual(resource, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('resource miminal with baseUrl', t => {
  t.plan(1)
  const { Empty } = t.context.app.models
  const data = {id: 1, other: 'custom'}

  const resource = serializer({baseUrl: 'http://localhost:3000'}).resource(data, Empty)

  const expected = {id: 1, type: 'empties', links: {self: 'http://localhost:3000/empties/1'}}
  t.deepEqual(resource, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('resource with attributes', t => {
  t.plan(1)
  const { Author } = t.context.app.models
  const data = {id: 1, other: 'custom', name: 'joe bloggs'}
  const options = {baseUrl: 'http://authors.com/api/'}

  const resource = serializer(options).resource(data, Author)

  const expected = {
    id: 1,
    type: 'authors',
    links: {self: 'http://authors.com/api/authors/1'},
    attributes: {name: 'joe bloggs', email: undefined},
    relationships: {
      posts: {
        links: {
          related: 'http://authors.com/api/authors/1/posts'
        }
      },
      comments: {
        links: {
          related: 'http://authors.com/api/authors/1/comments'
        }
      }
    }
  }
  t.deepEqual(resource, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('included', t => {
  t.plan(1)
  const { Post } = t.context.app.models
  const data = {id: 1, title: 'my title', comments: [
    {id: 1, comment: 'my comment'}
  ]}

  const included = serializer().included(data, Post)

  const expected = [{
    id: 1,
    type: 'comments',
    links: {self: '/comments/1'},
    attributes: {comment: 'my comment', title: undefined},
    relationships: {
      post: {links: {related: '/comments/1/post'}}
    }
  }]
  t.deepEqual(included, expected, `serialized should match ${JSON.stringify(expected)}`)
})

test('included comments length 2', t => {
  t.plan(2)
  const { Post } = t.context.app.models
  const data = {id: 1, title: 'my title', comments: [
    {id: 1, comment: 'my comment 1'},
    {id: 2, comment: 'my comment 2'}
  ]}

  const included = serializer().included(data, Post)

  t.truthy(included, 'included should be truthy')
  t.is(included.length, 2, 'included length should be 2')
})

test('included comments with post with critic', t => {
  t.plan(2)
  const { Post } = t.context.app.models
  const data = {id: 1, title: 'my title', comments: [
    {
      id: 1,
      comment: 'my comment 1',
      post: {
        id: 2,
        title: 'my post 2',
        critics: [
          {id: 1, name: 'critic 1'},
          {id: 2, name: 'critic 2'}
        ]
      }
    }
  ]}

  const included = serializer().included(data, Post)
  t.truthy(included, 'included should be truthy')
  t.is(included.length, 4, 'included length should be 4')
})

test('included comments with post with critic', t => {
  t.plan(2)
  const { Post } = t.context.app.models
  const data = {
    id: 2,
    title: 'my post 2',
    critics: [ { id: 1, name: 'critic 1' }, { id: 2, name: 'critic 2' } ]
  }

  const included = serializer().included(data, Post)
  t.truthy(included, 'included should be truthy')
  t.is(included.length, 2, 'included length should be 4')
})

test('serialize single resource', t => {
  t.plan(4)
  const { Post } = t.context.app.models
  const data = {
    id: 2,
    title: 'my post 2'
  }

  const resource = serializer().serialize(data, Post)

  t.truthy(resource)
  t.truthy(resource.data)
  t.is(resource.data.id, 2)
  t.is(resource.data.type, 'posts')
})

test('serialize collection', t => {
  t.plan(6)
  const { Post } = t.context.app.models
  const data = [
    {id: 1, title: 'my post 1'},
    {id: 2, title: 'my post 2'},
    {id: 3, title: 'my post 3'}
  ]

  const resource = serializer().serialize(data, Post)

  t.truthy(resource)
  t.truthy(Array.isArray(resource.data))
  t.is(resource.data[0].id, 1)
  t.is(resource.data[1].id, 2)
  t.is(resource.data[2].id, 3)
  t.is(resource.data[0].type, 'posts')
})

test('serialize collection', t => {
  t.plan(8)
  const { Post } = t.context.app.models
  const data = {
    id: 2,
    title: 'my post 2',
    critics: [
      {id: 1, name: 'critic 1'},
      {id: 2, name: 'critic 2'}
    ]
  }

  const resource = serializer().serialize(data, Post)

  t.truthy(resource.included)
  t.truthy(resource.data)
  t.is(resource.data.id, 2)
  t.is(resource.data.type, 'posts')
  t.true(Array.isArray(resource.included))
  t.is(resource.included.length, 2)
  t.is(resource.included[0].id, 1)
  t.is(resource.included[0].type, 'critics')
})

test.only('included ensures uniqueness', t => {
  t.plan(6)
  const { Post } = t.context.app.models
  const data = [
    {id: 1, title: 'my post 2', critics: [{id: 1, name: 'critic 1'}, {id: 2, name: 'critic 2'}]},
    {id: 2, title: 'my post 2', author: {id: 1, name: 'critic 1', comments: [{id: 1, comment: 'hi'}, {id: 2}]}},
    {id: 3, title: 'my post 2', author: {id: 1, name: 'critic 1', comments: [{id: 1, comment: 'hi'}, {id: 2}]}}
  ]

  const collection = serializer().serialize(data, Post)

  t.true(Array.isArray(collection.included))
  t.is(collection.included.length, 5)
  t.truthy(collection.included[0].id)
  t.is(collection.included[2].id, 1)
  t.is(collection.included[2].type, 'authors')
  t.truthy(collection.included[2].relationships.comments.data)
})
