import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

// see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-rds/index.html
export default async function getDbInstances() {
    const region = "us-east-1";
    const client = new RDSClient({
	    region,
	    credentials: fromCognitoIdentityPool({
	      client: new CognitoIdentityClient({ region }),
	      identityPoolId: "us-east-1:6f6d1285-9151-4cdc-81d4-cfddf31ecdfb",
        })
    });

    const command = new DescribeDBInstancesCommand({});
    return await client.send(command).DBInstances;
}