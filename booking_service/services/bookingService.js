// const { Kafka } = require("kafkajs");
const Redis = require("ioredis");
const { Ticket } = require("../models");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
});

// const kafka = new Kafka({
//     /* ... */
// });
// const kafkaProducer = kafka.producer();

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
    await Ticket.bulkCreate(bookings);

    //@TODO kafka call for

    lockKeys.forEach(async (lockKey) => {
        await releaseLock(lockKey, "V0");
    });

    return true;
};

module.exports = { bookTickets };
