const express = require('express')

const router = express.Router()
const path = require('path')

const api = require('./api')

router.use('/api', api)

module.exports = router
