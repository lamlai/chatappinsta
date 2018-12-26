module.exports = (sequelize, type) => {
    return sequelize.define('website', {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        domain: {
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
        user_id: {
            type: type.INTEGER
        },
        start_date: {
            type: type.DATE,
            defaultValue: type.NOW
        },
        expire_date: {
            type: type.DATE,
            defaultValue: type.NOW
        },
        last_add_bill_date: {
            type: type.DATE,
            defaultValue: type.NOW
        }
    })
}