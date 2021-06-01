import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { 
    CognitoIdentityClient, 
    GetIdCommand ,
    GetOpenIdTokenCommand
} from "@aws-sdk/client-cognito-identity";
import { getDefaultRoleAssumerWithWebIdentity } from "@aws-sdk/client-sts";
import { fromWebToken } from "@aws-sdk/credential-provider-web-identity";

const region = "us-east-1";
const cognitoClient = new CognitoIdentityClient({ region })

// see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-rds/index.html
export default async function getDbInstances() {
    const { Token, IdentityId } = await getTokenUsingBasicFlow();
    const client = new RDSClient({
	    region,
	    credentials: fromWebToken({ 
            roleArn: "arn:aws:iam::960031658638:role/Cognito_RDSDataAppPoolUnauth_Role",
            webIdentityToken: Token,
            roleSessionName: IdentityId.substring(IdentityId.indexOf(":") + 1),
            roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity()
         })
    });

    const command = new DescribeDBInstancesCommand({});
    return (await client.send(command)).DBInstances;
}

async function getTokenUsingBasicFlow() {
    const getIdCommand = new GetIdCommand({ IdentityPoolId: "us-east-1:6f6d1285-9151-4cdc-81d4-cfddf31ecdfb" });
    const id = (await cognitoClient.send(getIdCommand)).IdentityId;
    const getOpenIdTokenCommand = new GetOpenIdTokenCommand({ IdentityId: id });
    return await cognitoClient.send(getOpenIdTokenCommand);
}