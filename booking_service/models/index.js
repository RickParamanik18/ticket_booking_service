const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
});

const Ticket = require("./Ticket")(sequelize);

module.exports = { sequelize, Ticket };
