import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { 
    CognitoIdentityClient, 
    GetIdCommand ,
    GetOpenIdTokenCommand
} from "@aws-sdk/client-cognito-identity";
import { getDefaultRoleAssumerWithWebIdentity } from "@aws-sdk/client-sts";
import { fromWebToken } from "@aws-sdk/credential-provider-web-identity";
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const region = "us-east-1";
const cognitoClient = new CognitoIdentityClient({ region })

// see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-rds/index.html
export default async function getDbInstancesWithMetrics() {
    const { Token, IdentityId } = await getTokenUsingBasicFlow();
    const credentials = fromWebToken({ 
        roleArn: "arn:aws:iam::960031658638:role/Cognito_RDSDataAppPoolUnauth_Role",
        webIdentityToken: Token,
        roleSessionName: IdentityId.substring(IdentityId.indexOf(":") + 1),
        roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity()
     })

    const rdsClient = new RDSClient({ region, credentials});
    const describeInstancesCommand = new DescribeDBInstancesCommand({});
    const instances = (await rdsClient.send(describeInstancesCommand)).DBInstances;

    const cloudWatchClient = new CloudWatchClient({ region, credentials });
    const getMetricDataCommand = new GetMetricDataCommand(buildMetricQuery(instances));
    const metrics = (await cloudWatchClient.send(getMetricDataCommand)).MetricDataResults

    return instances.map(instance => {
        return {
            ...instance,
            cpu: metrics.find(metric => metric.Id === formatMetricId(`${instance.DBInstanceIdentifier}-cpu`)).Values[0],
            conns: metrics.find(metric => metric.Id === formatMetricId(`${instance.DBInstanceIdentifier}-conns`)).Values[0]
        }
    })
}

async function getTokenUsingBasicFlow() {
    const getIdCommand = new GetIdCommand({ IdentityPoolId: "us-east-1:6f6d1285-9151-4cdc-81d4-cfddf31ecdfb" });
    const getOpenIdTokenCommand = new GetOpenIdTokenCommand({ IdentityId: id });
    return await cognitoClient.send(getOpenIdTokenCommand)
}

function buildMetricQuery(dbInstances) {
    const end = new Date() // now
    end.setMinutes(end.getMinutes(), 0, 0) // set seconds / millis to zero for better performance
    const start = new Date(end - (60 * 2000)) // 2 mins before. This will capture at least 1 datapoint

    const metricDataQueries = []
    dbInstances.forEach(instance => {
        metricDataQueries.push(buildMetricDataQuery("cpu", "CPUUtilization", instance.DBInstanceIdentifier))
        metricDataQueries.push(buildMetricDataQuery("conns", "DatabaseConnections", instance.DBInstanceIdentifier))
    });

    return {
        StartTime: start,
        EndTime: end,
        MetricDataQueries: metricDataQueries
    }
}

function buildMetricDataQuery(metricSuffix, metricName, resourceId, stat) {
    return {
        Id: formatMetricId(`${resourceId}-${metricSuffix}`),
        ReturnData: true,
        MetricStat: {
            Metric: {
                Namespace: "AWS/RDS",
                MetricName: metricName,
                Dimensions: [
                    {
                        Name: "DBInstanceIdentifier",
                        Value: resourceId
                    }
                ]
            },
            Period: 60,
            Stat: "Average"
        }
    }
}

function formatMetricId(id) {
    return id.replaceAll("-", "_")
}