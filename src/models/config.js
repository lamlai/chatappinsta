module.exports = (sequelize, type) => {
    return sequelize.define('config', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
            type: type.STRING
        },
        value: {
            type: type.TEXT
        }
    }, {
        timestamps: false
    })
}