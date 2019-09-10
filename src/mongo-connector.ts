import config from '@/config'
const { MONGODB_URI } = config

import Bluebird from 'bluebird'
import mongo from 'connect-mongo'
import expressSession from 'express-session'
import mongoose from 'mongoose'
import { Connection, ConnectionOptions } from 'mongoose'
import logger from './utils/logger'

/**
 * @author val.rudi
 */
class MongoConnector {
  public connection: Connection
  // DB store
  public Store: mongo.MongoStoreFactory

  constructor() {
    /**
     * Load environment variables from .env file, where API keys and passwords are configured.
     */
    ;(mongoose as any).Promise = Bluebird
    this.Store = mongo(expressSession)
  }

  /**
   * Initiate connection to MongoDB
   * @returns {Promise<any>}
   */
  public connect(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      // mongoose.connection.once('open', function() {
      //     console.log('MongoDB event open');
      //     console.log('MongoDB connected [%s]', process.env.MONGODB_URI);
      //
      //     mongoose.connection.on('connected', () => {
      //         console.log('MongoDB event connected');
      //     });
      //
      //     mongoose.connection.on('disconnected', () => {
      //         console.log('MongoDB event disconnected');
      //     });
      //
      //     mongoose.connection.on('reconnected', () => {
      //         console.log('MongoDB event reconnected');
      //     });
      //
      //     mongoose.connection.on('error', (err) => {
      //         console.log('MongoDB event error: ' + err);
      //     });
      //
      //     return resolve();
      // });

      const options: ConnectionOptions = {
        keepAlive: true,
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
      this.connection = mongoose.connection
      const mongoUri = MONGODB_URI
      mongoose
        .connect(mongoUri, options)
        .then(() => {
          const indexOfA = mongoUri.indexOf('@')
          const db =
            indexOfA !== -1
              ? mongoUri.substring(0, 10) +
                '!_:_!' +
                mongoUri.substring(indexOfA)
              : mongoUri
          logger.debug(`MongoDB connected ${db}`)
          resolve()
        })
        .catch(reject)
    })
  }

  /**
   * Disconnects from MongoDB
   * @returns {Promise<void>}
   */
  public disconnect(): Promise<void> {
    return this.connection.close()
  }
}
const mongoConnector = new MongoConnector()
export default mongoConnector
