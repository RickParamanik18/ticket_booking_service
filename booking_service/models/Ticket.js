const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("Ticket", {
        user_id: { type: DataTypes.STRING, allowNull: false },
        event_id: { type: DataTypes.STRING, allowNull: false },
        seat_id: { type: DataTypes.STRING, allowNull: false },
    });
};
