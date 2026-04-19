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
    let results = await Ticket.create({
        user_id,
        event_id,
        seats: JSON.stringify(seats),
    });

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

function mergeData(events, dbData) {
    const eventMap = new Map(events.map((event) => [event._id, event]));

    return dbData.map((booking) => {
        const event = eventMap.get(booking.event_id);
        return {
            id: booking.id,
            event_id: booking.event_id,
            seats: JSON.parse(booking.seats),
            event_name: event?.event_name,
            event_date: event?.event_date,
            start_time: event?.start_time,
            end_time: event?.end_time,
        };
    });
}

const getTicketDetails = async (user_id) => {
    let dbData = await Ticket.findAll({
        where: {
            user_id,
        },
    });
    dbData = dbData.map((data) => data.dataValues);

    const event_ids = [];
    dbData.map((data) => {
        if (!event_ids.includes(data.event_id)) event_ids.push(data.event_id);
    });

    const res = await fetch("http://event_service:5002/multiple_events", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            event_ids,
        }),
    });
    const events = await res.json();

    return mergeData(events, dbData);
};

module.exports = { bookTickets, getTicketDetails };
