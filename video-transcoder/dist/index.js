"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
const sqsClient = new client_sqs_1.SQSClient({
    region: "eu-north-1",
    credentials: {
        accessKeyId: "AKIA5YKPSDPK5BPPZTH2",
        secretAccessKey: "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"
    }
});
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_sqs_1.ReceiveMessageCommand({
            QueueUrl: "https://sqs.eu-north-1.amazonaws.com/945596537813/video-service-raw-queue",
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20,
        });
        while (true) {
            const { Messages } = yield sqsClient.send(command);
            if (!Messages) {
                console.log("No messages in queue");
                continue;
            }
            for (const message of Messages) {
                const { Body, MessageId } = message;
                console.log(Body, MessageId);
            }
        }
    });
}
init();
