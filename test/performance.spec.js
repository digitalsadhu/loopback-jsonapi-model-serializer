import test from 'ava'
import loopback from 'loopback'
import serialize from '../src'

test.beforeEach(t => {
  const app = t.context.app = loopback()
  app.set('legacyExplorer', false)

  const ds = loopback.createDataSource('memory')

  const Post = ds.createModel('post', {title: String})
  const Comment = ds.createModel('comment', {title: String})
  const Author = ds.createModel('author', {name: String})

  app.model(Post)
  app.model(Author)
  app.model(Comment)

  Post.hasMany(Comment)
  Post.belongsTo(Author)
  Comment.belongsTo(Author)

  app.use(loopback.rest())
})

test.beforeEach(async t => {
  const { Post, Author, Comment } = t.context.app.models
  const author = await Author.create({name: 'Bob Smith'})
  for (let i = 0; i < 1000; i++) {
    const post = await Post.create({title: `post ${i}`, authorId: author.id})
    for (let x = 0; x < 10; x++) {
      await Comment.create({title: 'my comment', postId: post.id, authorId: author.id})
    }
  }
})

test.beforeEach(async t => {
  const { Post } = t.context.app.models
  const posts = await Post.find({include: ['author', {comments: 'author'}]})
  t.context.posts = posts
})

test('id', t => {
  t.plan(4)
  const { Post } = t.context.app.models
  const data = t.context.posts

  const posts = serialize(data, Post)

  t.truthy(posts)
  t.true(Array.isArray(posts.data))
  t.is(posts.data.length, 1000)
  t.true(Array.isArray(posts.included))
})
