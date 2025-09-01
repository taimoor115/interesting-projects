import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda"
import { DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";


const sqsClient = new SQSClient({
    region: "",
    credentials: {
        accessKeyId: "",
        secretAccessKey: ""
    }

})

async function init() {
    const command = new ReceiveMessageCommand({
        QueueUrl: "",
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,

    })

    while (true) {
        const { Messages } = await sqsClient.send(command);

        if (!Messages) {
            console.log("No messages in queue");
            continue;
        }


        try {
            for (const message of Messages) {
                const { Body, MessageId } = message;

                console.log(Body, MessageId);


                if (!Body) {
                    console.log("No body for the message")
                    continue;
                }
                // Validate & parse the event 

                const event = JSON.parse(Body) as S3Event;

                if ("Service" in event && "Event" in event) {

                    if (event.Event === "s3:TestEvent") {
                        continue
                    }



                    for (const record of event.Records) {
                        const { s3, eventName } = record || {}

                        const { bucket, object: { key } } = s3 || {}
                        // Spin the docker container 
                        const ecsClient = new ECSClient({
                            region: "",
                            credentials: {
                                accessKeyId: "",
                                secretAccessKey: ""
                            }
                        });

                        const runTaskCommand = new RunTaskCommand({
                            cluster: "", // your ECS cluster name
                            taskDefinition: "", // your ECS task definition
                            launchType: "FARGATE",
                            networkConfiguration: {
                                awsvpcConfiguration: {
                                    subnets: [""], // your subnet IDs
                                    assignPublicIp: "ENABLED"
                                }
                            },
                            overrides: {
                                containerOverrides: [
                                    {
                                        name: "", // container name in your task definition
                                        environment: [
                                            { name: "BUCKET", value: bucket?.name },
                                            { name: "KEY", value: key }
                                        ]
                                    }
                                ]
                            }
                        });

                        await ecsClient.send(runTaskCommand);
                        // Use vercel clone thing

                    }


                    // Delete the message from the queue 
                    await sqsClient.send(new DeleteMessageCommand({
                        QueueUrl: "",
                        ReceiptHandle: message.ReceiptHandle!,
                    }));

                }
            }
        } catch (error) {

            console.error("==================Error in the init function==============")
            console.error(error)
        }
    }
}
init()