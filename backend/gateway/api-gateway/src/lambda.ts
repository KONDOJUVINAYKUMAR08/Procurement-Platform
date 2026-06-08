import serverless from 'serverless-http';
import { app, bootstrapApp } from './index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

let serverlessHandler: serverless.Handler;
let isBootstrapped = false;

export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  if (!isBootstrapped) {
    // Await the bootstrap logic once per cold start to connect to DynamoDB and load secrets
    await bootstrapApp();
    serverlessHandler = serverless(app);
    isBootstrapped = true;
  }

  return serverlessHandler(event, context);
};
