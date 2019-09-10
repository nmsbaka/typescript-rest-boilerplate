import config from '@/config'
const { PORT, SESSION_SECRET, JWT_SECRET } = config

import cors from 'cors'
import express from 'express'
import expressSession from 'express-session'
import http from 'http'
import morgan from 'morgan'
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt'
import path from 'path'
import { PassportAuthenticator, Server } from 'typescript-rest'
import mongoConnector from './mongo-connector'

export class ApiServer {
  public PORT: number = +PORT || 3000

  private readonly app: express.Application
  private server: http.Server

  constructor() {
    this.app = express()
    this.config()

    Server.useIoC()

    Server.loadServices(this.app, 'controller/*', __dirname)
    Server.swagger(this.app, {
      filePath: './dist/swagger.json',
      endpoint: 'api-docs',
    })
  }

  /**
   * Start the server
   */
  public async start() {
    return new Promise<any>((resolve, reject) => {
      this.server = this.app.listen(this.PORT, (err: any) => {
        if (err) {
          return reject(err)
        }

        // TODO: replace with Morgan call
        // tslint:disable-next-line:no-console
        console.log(`Listening to http://127.0.0.1:${this.PORT}`)

        return resolve()
      })
    })
  }

  /**
   * Stop the server (if running).
   * @returns {Promise<boolean>}
   */
  public async stop(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this.server) {
        this.server.close(() => {
          return resolve(true)
        })
      } else {
        return resolve(true)
      }
    })
  }

  /**
   * Configure the express app.
   */
  private config(): void {
    // Native Express configuration
    this.app.use(
      expressSession({
        resave: false, // don't save session if unmodified
        saveUninitialized: true,
        secret: SESSION_SECRET,
        store: new mongoConnector.Store({
          mongooseConnection: mongoConnector.connection,
        }),
      }),
    )
    this.app.use(
      express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }),
    )
    this.app.use(cors())
    this.app.use(morgan('combined'))
    this.configureAuthenticator()
  }

  private configureAuthenticator() {
    const jwtConfig: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(JWT_SECRET),
    }
    const strategy = new Strategy(
      jwtConfig,
      (payload: any, done: (err: any, user: any) => void) => {
        done(null, payload)
      },
    )
    const authenticator = new PassportAuthenticator(strategy, {
      deserializeUser: (user: string) => JSON.parse(user),
      serializeUser: (user: any) => {
        return JSON.stringify(user)
      },
    })
    Server.registerAuthenticator(authenticator)
    Server.registerAuthenticator(authenticator, 'secondAuthenticator')
  }
}
