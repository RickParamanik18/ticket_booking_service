// const { Kafka } = require("kafkajs");
const Redis = require("ioredis");

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

const bookTickets = async (userId, eventId, seats) => {
    const ttl = 60000;
    const lockKeys = seats.map((seatId) => `seat:${eventId}:${seatId}`);

    if (await anyExists(...lockKeys)) {
        return false;
    }

    lockKeys.forEach(async (lockKey) => {
        await acquireLock(lockKey, "V0", ttl);
    });

    //DB Call - save to booking DB
    //kafka call for

    lockKeys.forEach(async (lockKey) => {
        await releaseLock(lockKey, "V0");
    });

    // const lockKey = `seat:${eventId}:${seatId}`;
    // const ttl = 60000;
    // const isLockAcquired = await acquireLock(lockKey, "V0", ttl);
    // console.log({ isLockAcquired });
    // if (!isLockAcquired) return false;

    // console.log(await allExists("key1", "Key2", "Key3"));
    //critical section

    // release lock

    return true;
    // for (let attempt = 0; attempt < maxRetries; attempt++) {
    //     // Read current version (atomic, inside Lua)
    //     // You just pass expected version; Lua returns conflict if mismatch.
    //     const expectedVer = attempt === 0 ? "0" : "0"; // or fetch from DB if you store it

    //     const now = Date.now().toString();

    //     const result = await redis.reserveSeat(
    //         seatKey,
    //         expectedVer,
    //         "reserved",
    //         (parseInt(expectedVer) + 1).toString(),
    //         userId,
    //         ttl.toString(),
    //         now,
    //     );

    //     const success = result[0];
    //     const newVersion = result[1];

    //     if (success === 1) {
    //         console.log(`✅ Seat ${seatId} reserved for user ${userId}`);
    //         // await kafkaProducer.send({
    //         //     topic: "seat-hold-success",
    //         //     messages: [
    //         //         {
    //         //             value: JSON.stringify({
    //         //                 userId,
    //         //                 eventId,
    //         //                 seatId,
    //         //                 version: newVersion,
    //         //             }),
    //         //         },
    //         //     ],
    //         // });
    //         return { success: true, version: newVersion };
    //     } else {
    //         if (newVersion === "missing") {
    //             throw new Error("SEAT_NOT_FOUND");
    //         }
    //         console.log(
    //             `🔁 Version conflict on seat ${seatId}, retry ${attempt + 1}/${maxRetries}`,
    //         );
    //         // Optional: small delay if you want
    //         if (attempt === maxRetries - 1) {
    //             throw new Error("SEAT_CONFLICT");
    //         }
    //     }
    // }
};

module.exports = { bookTickets };
