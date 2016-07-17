import test from 'ava'
import loopback from 'loopback'
import serializer from '../serializer'

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

test.beforeEach(async t => {
  const { Post, Author, Comment, Parent, Critic } = t.context.app.models

  await Post.create({id: 1, authorId: 1, title: 'my post', content: 'post 1', parentType: 'parent', parentId: 1})
  await Comment.create({id: 1, postId: 1, title: 'comment 1', comment: 'my comment 1'})
  await Comment.create({id: 2, postId: 2, title: 'comment 2', comment: 'my comment 2'})
  await Author.create({id: 1, name: 'Joe', email: 'joe@email.com'})
  await Parent.create({id: 1, name: 'father'})
  await Critic.create({id: 1, name: 'Sam'})
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