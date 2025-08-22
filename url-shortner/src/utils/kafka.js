const { Kafka, logLevel } = require("kafkajs");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "url-shortener",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  logLevel: logLevel.NOTHING,
});

const producer = kafka.producer({ allowAutoTopicCreation: true });

let _connected = false;
async function ensureConnected() {
  if (!_connected) {
    await producer.connect();
    _connected = true;
  }
}

async function sendAnalytics(event) {
  try {
    await ensureConnected();
    await producer.send({
      topic: process.env.KAFKA_TOPIC || "analytics-events",
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (err) {
    console.error("Kafka produce error:", err.message);
  }
}

process.on("beforeExit", async () => {
  if (_connected) await producer.disconnect();
});

module.exports = { sendAnalytics };
