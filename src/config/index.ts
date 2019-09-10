import logger from '@/utils/logger'
import { isBlank, isString } from '@/utils/utils'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const { env } = process

interface IEnvironment {
  name: string
}

interface IRequireEnvironment extends IEnvironment {
  message: string
  check(val: any): boolean
}

interface IUploadConfig {
  availableMime: {
    [key: string]: string[]
    image: string[]
    pdf: string[]
  }
  path: {
    [key: string]: string
    image: string
    attachment: string
  }
  limits: {
    fileSize: {
      [key: string]: number
    }
    maxCount: {
      [key: string]: number
    }
  }
}

class AppConfig {
  public HOST_URL: string

  public MONGODB_URI: string

  public SESSION_SECRET: string

  public CONTAINER_NAME: string

  public EXCHANGE_API_KEY: string

  public EXCHANGE_URI: string

  public ENVIRONMENT?: string

  public PORT: number

  public JWT_SECRET: string

  public UPLOAD: IUploadConfig = {
    availableMime: {
      image: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/svg+xml',
        'image/tiff',
        'image/webp',
      ],
      pdf: ['application/pdf'],
    },
    path: {
      image: path.join(__dirname, '../public/images'),
      attachment: path.join(__dirname, '../store/attachments'),
    },
    limits: {
      fileSize: {
        image: 5 * 1024 * 1024, // 5MB,
        attachment: 20 * 1024 * 1024, // 20MB
      },
      maxCount: {
        image: 5,
        attachment: 1,
      },
    },
  }

  private opt: IEnvironment[] = [
    { name: 'CONTAINER_NAME' },
    { name: 'HOST_URL' },
    { name: 'PORT' },
  ]

  private requires: IRequireEnvironment[] = [
    {
      name: 'MONGODB_URI',
      check: (val: any) => isString(val) && !isBlank(val),
      message:
        'No mongo connection string. Set MONGODB_URI environment variable.',
    },
    {
      name: 'SESSION_SECRET',
      check: (val: any) => isString(val) && !isBlank(val),
      message: 'No client secret. Set SESSION_SECRET environment variable.',
    },
    {
      name: 'JWT_SECRET',
      check: (val: any) => isString(val) && !isBlank(val),
      message:
        'No secret of json web token. Set JWT_SECRET environment variable.',
    },
  ]

  constructor() {
    this.useDotEnv()
    this.processEnvironment()
  }

  private useDotEnv() {
    if (!isString(env.CONTAINER_NAME) || !isBlank(env.CONTAINER_NAME)) {
      if (fs.existsSync('.env')) {
        logger.debug('Using .env file to supply config environment variables')
        dotenv.config({ path: '.env' })
      } else {
        logger.debug(
          'Using .env.example file to supply config environment variables',
        )
        dotenv.config({ path: '.env.example' }) // you can delete this after you create your own .env file!
      }
      this.ENVIRONMENT = env.NODE_ENV
    }
  }

  private processEnvironment() {
    try {
      ;[...this.opt, ...this.requires].forEach(declares => {
        const { name } = declares
        const val = process.env[name]
        if (this.isRequireEnv(declares)) {
          const { message, check } = declares
          if (!check(val)) throw new Error(message)
        }
        if (val) this.setValue(name, val)
      })
    } catch (error) {
      logger.error(error.message)
      process.exit(1)
    }
  }

  private isRequireEnv(val: any): val is IRequireEnvironment {
    return val && val.name && val.message && val.check
  }

  private setValue(name: string, val: any) {
    Object.assign(this, { [name]: val })
  }
}

const config = new AppConfig()
export default config
