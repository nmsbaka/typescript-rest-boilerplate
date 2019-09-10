'use strict'

import { start } from './start'
import logger from './utils/logger'

start().catch(err => {
  logger.error(`Error starting server: ${err.message}`)
  process.exit(-1)
})
