import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import {
  ChangeAction,
  ChangeResourceRecordSetsCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
  RRType,
} from '@aws-sdk/client-route-53'
import type { LambdaFunctionURLHandler } from 'aws-lambda'
import { LambdaFunctionURLEvent, LambdaFunctionURLResult } from 'aws-lambda/trigger/lambda-function-url.js'
import crypto from 'node:crypto'
import { assertString } from '../utils/assert-string.function.js'
import { pickPropsAssertDefined } from '../utils/pick-props-assert-defined.function.js'

const TABLE_NAME = process.env.TABLE_NAME

const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION })
const route53 = new Route53Client({ region: process.env.AWS_REGION })

export const handler: LambdaFunctionURLHandler<any> = async (
  ev: LambdaFunctionURLEvent,
): Promise<LambdaFunctionURLResult<any>> => {
  try {
    if (ev.requestContext.http.method !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const payload = parseRequestPayload(ev)
    const config = await readConfig(payload.ddnsHostname)

    checkHash(config, payload)

    const currentRecordValue = await getDnsRecordValue(config.zoneId, config.hostname, RRType.A)

    if (currentRecordValue === payload.sourceIp) {
      return {
        statusCode: 200,
        body: 'Your IP address matches the current Route53 DNS record.',
      } satisfies LambdaFunctionURLResult
    } else {
      await upsertRecordValue(config.zoneId, config.hostname, config.recordTtl, RRType.A, payload.sourceIp)
      return {
        statusCode: 200,
        body: `${payload.ddnsHostname} has been updated to ${payload.sourceIp}`,
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: error instanceof Error ? error.message : 'unknown error',
    }
  }
}

interface RequestPayload {
  sourceIp: string
  ddnsHostname: string
  validationHash: string
}

function parseRequestPayload(ev: LambdaFunctionURLEvent): RequestPayload {
  const payload = pickPropsAssertDefined(JSON.parse(ev.body ?? '{}') as Record<string, unknown>, [
    'validation_hash',
    'ddns_hostname',
  ])
  return {
    sourceIp: ev.requestContext.http.sourceIp,
    ddnsHostname: assertString(payload.ddns_hostname),
    validationHash: assertString(payload.validation_hash),
  }
}

interface Config {
  hostname: string
  secret: string
  zoneId: string
  recordTtl: number
}

async function readConfig(hostname: string): Promise<Config> {
  const command = new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { hostname: { S: hostname } },
  })
  const response = await dynamoDb.send(command)
  return {
    hostname: assertString(response.Item?.hostname.S),
    secret: assertString(response.Item?.secret.S),
    zoneId: assertString(response.Item?.zoneId.S),
    recordTtl: parseInt(assertString(response.Item?.recordTtl.N), 10),
  }
}

function checkHash(config: Config, payload: RequestPayload): void {
  if (!/^[0-9a-fA-F]{64}$/.test(payload.validationHash)) {
    throw new Error('You must pass a valid sha256 hash in the hash= argument.')
  }

  const hashCheck = payload.sourceIp + config.hostname + config.secret
  const calculatedHash = crypto.createHash('sha256').update(hashCheck).digest('hex')

  if (calculatedHash !== payload.validationHash) {
    throw new Error('Validation hashes do not match.')
  }
}

async function getDnsRecordValue(zoneId: string, hostname: string, type: RRType): Promise<string | null> {
  const command = new ListResourceRecordSetsCommand({
    HostedZoneId: zoneId,
    StartRecordName: hostname,
    StartRecordType: type,
    MaxItems: 1,
  })
  const response = await route53.send(command)
  return response.ResourceRecordSets?.[0]?.ResourceRecords?.[0]?.Value || null
}

async function upsertRecordValue(
  zoneId: string,
  hostname: string,
  ttl: number,
  type: RRType,
  value: string,
): Promise<void> {
  const command = new ChangeResourceRecordSetsCommand({
    HostedZoneId: zoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: ChangeAction.UPSERT,
          ResourceRecordSet: {
            Name: hostname,
            Type: type,
            TTL: ttl,
            ResourceRecords: [{ Value: value }],
          },
        },
      ],
    },
  })
  await route53.send(command)
}
