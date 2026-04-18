const { Kafka } = require("kafkajs");
const Redis = require("ioredis");
const { Ticket } = require("../models");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
});
const topicsToCreate = [
    {
        name: "bookings",
        partitions: 2,
        replicationFactor: 1,
    },
];

const kafka = new Kafka({
    clientId: "ticket_booking_service",
    brokers: ["kafka:9092"],
});
(async () => {
    const admin = kafka.admin();
    try {
        await admin.connect();
        console.log("Kafka Admin Client Connectd");
        const topics = await admin.listTopics();
        console.log("Existing Topics", topics);

        const created = await admin.createTopics({
            topics: topicsToCreate.map((topic) => ({
                topic: topic.name,
                numPartitions: topic.partitions || 2,
                replicationFactor: topic.replicationFactor || 1,
            })),
        });
        console.log({ created });
    } catch (err) {
        console.error("Kafka Init Err", err);
    } finally {
        await admin.disconnect();
        console.log("Kafka Admin Client Disconnected");
    }
})();

const kafkaProducer = kafka.producer();

const acquireLock = async (lockKey, lockValue, ttl) => {
    const result = await redis.set(lockKey, lockValue, "NX", "PX", ttl);
    return result === "OK";
};
const releaseLock = async (lockKey, lockValue) => {
    const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL",KEYS[1])
        else
            return 0
        end
    `;
    return await redis.eval(script, 1, lockKey, lockValue);
};
const anyExists = async (...args) => {
    const count = await redis.exists(...args);
    return count > 0;
};

const bookTickets = async (user_id, event_id, seats) => {
    const ttl = 60000;
    const lockKeys = seats.map((seat_id) => `seat:${event_id}:${seat_id}`);

    if (await anyExists(...lockKeys)) {
        return false;
    }

    lockKeys.forEach(async (lockKey) => {
        await acquireLock(lockKey, "V0", ttl);
    });

    //DB Call - save to booking DB
    const bookings = [];
    for (const seat_id of seats) {
        bookings.push({ user_id, event_id, seat_id });
    }
    let results = await Ticket.bulkCreate(bookings);
    results = results.map((result) => result.dataValues);

    console.log(results);
    console.log("checkpoint 1");
    //@TODO kafka call for

    await kafkaProducer.connect();
    await kafkaProducer.send({
        topic: "booking",
        messages: [
            {
                key: "1",
                value: JSON.stringify(results),
            },
        ],
    });
    console.log("checkpoint 2");

    lockKeys.forEach(async (lockKey) => {
        await releaseLock(lockKey, "V0");
    });

    return true;
};

module.exports = { bookTickets };
