import { App, CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Code, Function as LambdaFunction, FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'node:path'
import { resolveStageInfo } from './utils/branch-name.utils.js'
import { readFromEnvOrDie } from './utils/read-from-env.function.js'
import { createStackName } from './utils/stack-name.utils.js'

const __dirname = new URL('.', import.meta.url).pathname

const stageInfo = resolveStageInfo()
const hostedZoneIds = readFromEnvOrDie('AWS_HOSTED_ZONE_IDS').split(',')

const app = new App()

const stack = new Stack(app, 'dyn-dns-easy', { stackName: createStackName('dyn-dns-easy', stageInfo.stage) })

const table = new Table(stack, 'config-table', {
  tableName: `${stack.stackName}-config`,
  partitionKey: { name: 'hostname', type: AttributeType.STRING },
  removalPolicy: RemovalPolicy.DESTROY,
  billingMode: BillingMode.PAY_PER_REQUEST,
})

const lambdaRole = new Role(stack, 'api-lambda-role', {
  roleName: `${stack.stackName}-api-lambda-role`,
  assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
  description: 'DynamicDNS Lambda role',
  inlinePolicies: {
    cloudwatch: new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ['*'],
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        }),
      ],
    }),
    route53: new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: hostedZoneIds.map((id) => `arn:aws:route53:::hostedzone/${id}`),
          actions: ['route53:ChangeResourceRecordSets', 'route53:ListResourceRecordSets'],
        }),
      ],
    }),
    dynamodb: new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: ['*'],
          actions: ['dynamodb:GetItem'],
        }),
      ],
    }),
  },
})

const lambdaFn = new LambdaFunction(stack, 'api-lambda-fn', {
  functionName: `${stack.stackName}-api-lambda-fn`,
  // __dirname will be `iac/dist` and we need to navigate to the api/dist
  code: Code.fromAsset(join(__dirname, '../../service/dist/api')),
  handler: 'fn.handler',
  runtime: Runtime.NODEJS_22_X,
  memorySize: 128,
  timeout: Duration.seconds(20),
  environment: { TABLE_NAME: table.tableName },
  role: lambdaRole,
})

const fnUrl = lambdaFn.addFunctionUrl({ authType: FunctionUrlAuthType.NONE })

new CfnOutput(stack, 'output-config-table', { key: 'configTable', value: table.tableName })
new CfnOutput(stack, 'output-api-fn-url', { key: 'apiFnUrl', value: fnUrl.url })
