module.exports = (sequelize, type) => {
    return sequelize.define('customer', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fullname: {
            type: type.STRING
        },
        email: {
            type: type.STRING
        },
        phone: {
            type: type.STRING
        },
        chat_id: {
            type: type.STRING
        },
        target_chat_id: {
            type: type.INTEGER
        },
        website_id: {
            type: type.INTEGER
        },
    })
}