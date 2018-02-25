const express = require('express')

const router = express.Router()
const passport = require('passport')

const models = require('../models')

router.post('/register', passport.authenticate('local-signup'), (req, res) => {
  res.json(req.user)
})

router.post(
  '/authenticate',
  passport.authenticate('local-login'),
  (req, res) => {
    res.json(req.user)
  }
)

router.post('/logout', (req, res) => {
  if (!req.user) return res.status(500).json({ error: true })

  req.logout()
  res.json({ success: true })
})

router.get('/users', (req, res) => {
  if (!req.user) return res.status(401).end()

  models.User.find(
    {},
    { 'local.username': 1, 'local.online': 1, _id: 0 },
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: true })
      }

      res.json(users)
    }
  )
})

router.get('/username/:username', (req, res) => {
  req.params.username = req.params.username.toLowerCase()

  models.User.findOne(
    { 'local.username': req.params.username },
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: true })
      }

      return res.json({ alreadyInUse: !!user })
    }
  )
})

router.get('/user/channels', (req, res) => {
  if (!req.user) return res.status(401).end()

  models.User.findOne(
    { 'local.username': req.user },
    { 'local.channels': 1, _id: 0 },
    (err, channels) => {
      if (err) {
        return res.status(500).json({ error: true })
      }

      res.json(channels)
    }
  )
})

router.get('/channel/:name/messages', (req, res) => {
  if (!req.user) return res.status(401).end()

  req.params.name = req.params.name.toLowerCase()

  models.User.findOne({
    'local.username': req.user,
    'local.channels': req.params.name,
  })
    .exec()
    .then(user => {
      if (user) {
        return models.Message.find({ channel: req.params.name }).exec()
      }
      throw 'Not joined to channel.'
    })
    .then(messages => res.json(messages))
    .then(null, error => {
      res.status(401).json({ error })
    })
})

module.exports = router
