'use strict'
import 'module-alias/register'

import { ApiServer } from './api-server'
import mongoConnector from './mongo-connector'

export async function start(): Promise<void> {
  await mongoConnector.connect()
  const apiServer = new ApiServer()
  await apiServer.start()
  const graceful = async () => {
    await mongoConnector.disconnect()
    await apiServer.stop()
    process.exit(0)
  }

  // Stop graceful
  process.on('SIGTERM', graceful)
  process.on('SIGINT', graceful)
}
