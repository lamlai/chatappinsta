const request = require('request');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const {Customer, Website, Config} = require('./sequelize')
const date = require('date-and-time');
const fs = require('fs');
require('dotenv').config()

app.use(express.static('dist', {index: 'demo.html', maxage: '4h'}));
app.use(bodyParser.json());
app.use(fileUpload());

// handle admin Telegram messages
app.post('/hook', function (req, res) {
    try {
        const message = req.body.message || req.body.channel_post;
        const chatId = message.chat.id;
        const name = message.chat.first_name + ' ' + message.chat.last_name || message.chat.title || 'admin';
        const text = message.text || '';
        const reply = message.reply_to_message;
        if (text.startsWith('/start')) {
            console.log('/start chatId ' + chatId);
            sendTelegramMessage(chatId,
                '*Welcome to ASC Chat* \n' +
                'Your unique chat id is `' + chatId + '`',
                'Markdown');
        } else if (reply) {
            let replyText = reply.text || '';
            let userId = replyText.split(':')[0];
            userId = userId.split(' - ')[0];
            io.emit(chatId + '-' + userId, {name, text, from: 'admin'});
        } else if (text) {
            io.emit(chatId, {name, text, from: 'admin'});
        }
    } catch (e) {
        console.error('hook error', e, req.body);
    }
    res.statusCode = 200;
    res.end();
});

// handle chat visitors websocket messages
io.on('connection', function (client) {

    client.on('register', function (registerMsg) {
        let userId = registerMsg.userId;
        let chatId = registerMsg.chatId;
        let messageReceived = false;
        console.log('useId ' + userId + ' connected to chatId ' + chatId);

        client.on('message', function (msg) {
            if (msg.text.startsWith('updateCustomerInfo::::')) {
                let customerInfo = msg.text.split('::::')[1];
                let arrCustomerInfo = customerInfo.split('||||');
                let customerFullname = arrCustomerInfo[0];
                let customerEmail = arrCustomerInfo[1];
                const customer = Customer.findOne({where: {chat_id: userId}});
                customer.then(function (customer) {
                    if (!customer) {
                        Customer.create({
                            fullname: customerFullname,
                            email: customerEmail,
                            chat_id: userId,
                            target_chat_id: chatId,
                            website_id: 1
                        })
                    }
                })

            } else {
                const customer = Customer.findOne({where: {chat_id: userId}});
                customer.then(function (customer) {
                    let visitorName = userId;
                    if (customer) {
                        visitorName = customer.fullname
                    }
                    messageReceived = true;
                    io.emit(chatId + '-' + userId, msg);
                    sendTelegramMessage(chatId, userId+' - *'+visitorName+'*' + ': ' + msg.text, 'Markdown');
                })
            }

        });

        client.on('disconnect', function () {
            if (messageReceived) {
                const customer = Customer.findOne({where: {chat_id: userId}});
                customer.then(function (customer) {
                    let visitorName = userId;
                    if (customer) {
                        visitorName = customer.fullname
                    }
                    sendTelegramMessage(chatId, '*'+visitorName + '* đã thoát', 'Markdown');
                })

            }
        });
    });

});

function sendTelegramMessage(chatId, text, parseMode) {
    let rsp = request
        .post('https://api.telegram.org/bot' + process.env.TELEGRAM_TOKEN + '/sendMessage')
        .form({
            'chat_id': chatId,
            'text': text,
            'parse_mode': parseMode
        });
    return rsp;
}

function sendTelegramFile(chatId, file, customer, parseMode='Markdown') {
    const formData = {
        chat_id: chatId,
        document: fs.createReadStream(file),
        caption: '*'+ customer + '* Đã gửi file đính kèm',
        parse_mode: parseMode
    }
    let rsp = request
        .post({url: 'https://api.telegram.org/bot' + process.env.TELEGRAM_TOKEN + '/sendDocument', formData: formData},
            function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
        })
    return rsp;
}

app.post('/usage-start', function (req, res) {
    console.log('usage from', req.query.host);
    res.statusCode = 200;
    res.end();
});

// left here until the cache expires
app.post('/usage-end', function (req, res) {
    res.statusCode = 200;
    res.end();
});

app.get('/.well-known/acme-challenge/:content', (req, res) => {
    res.send(process.env.CERTBOT_RESPONSE);
});

app.post('/db/create/customer', (req, res) => {
    const body = req.body;
    let rsp = {
        'CODE': 200,
        'SUCCESS': 1,
        'Data': {}
    }
    const isUnique = Customer.findOne({where: {chat_id: body.chat_id}});
    isUnique.then(function (customer) {
        if (!customer) {
            Customer.create(body).then(function (customer) {
                rsp.Data = customer
                res.json(rsp)
            })
        } else {
            rsp.Data = customer
            res.json(rsp)
        }
    })
})

app.get('/customer/:websiteId/:customerId', (req, res) => {
    let rsp = {
        'Code': 400,
        'Success': 0,
        'Data': {}
    }
    if (req.params.customerId && req.params.websiteId) {
        Customer.findOne({where: {chat_id: req.params.customerId, website_id: req.params.websiteId }}).then(function (customer) {
            if (customer) {
                rsp.Code = 200
                rsp.Success = 1
                rsp.Data = customer
            } else {
                rsp.Code = 204
                rsp.Success = 1
            }
            res.json(rsp)
        })
    } else {
        res.json(rsp)
    }
})

app.post('/customer/upload/:domain/:customer_id', (req, res, next) => {
    let rsp = {
        'Code': 400,
        'Success': 0,
        'Message': '',
        'Data': {}
    }
    let now = new Date();
    let uploadFile = req.files.file
    let fileName = req.files.file.name
    const websiteDomain = req.params.domain
    const customerId = req.params.customer_id
    fileName = date.format(now, 'YYYYMMDDHHmmss')+'_'+fileName
    const savedFile = `${__dirname}/media/upload/${fileName}`;
    Website.findOne({where: {domain: websiteDomain}}).then(function (web) {
        if (web) {
            Customer.findOne({where: {chat_id: customerId, website_id: web.id }}).then(function (customer) {
                const chatId = web.chat_id
                let customerName
                if (customer) {
                    customerName = customer.fullname
                } else {
                    customerName = customerId
                }
                uploadFile.mv(
                    savedFile,
                    function (err) {
                        if (err) {
                            return res.status(500).send(err)
                        } else {
                            console.log(savedFile);
                            const sendImage = sendTelegramFile(chatId, savedFile, customerName)
                            res.json({
                                file: savedFile,
                            })
                        }
                    },
                )
            })



        } else {
            rsp.Code = 404
            rsp.Message = 'Không tìm thấy trang hoặc trang sử dụng không hợp lệ'
            return res.json(rsp)
        }

    })


})

app.get('/website/:urlRequest', (req, res) => {
    let rsp = {
        'Code': 400,
        'Success': 0,
        'Data': {}
    }
    Website.findOne({
        where: {
            domain: req.params.urlRequest
        }
    }).then(function (web) {
        if (web) {
            rsp.Code = 200
            rsp.Success = 1
            rsp.Data = web
        } else {
            rsp.Code = 204
            rsp.Success = 1
        }
        res.json(rsp)
    })
})

app.get('/check_allow', (req, res) => {
    let rsp = {
        'Code': 400,
        'Success': 0,
        'Data': {}
    }
    Config.findOne({
        where: {
            key: 'ALLOW_ALL'
        }
    }).then(function (conf) {
        if (conf) {
            let isGlobal = false
            if (conf.value == '1') {
                isGlobal = true
            }
            rsp.Code = 200;
            rsp.Success = 1;
            rsp.Data = { isGlobal: isGlobal }
            res.json(rsp)
        }
    })

})

http.listen(process.env.PORT || 3000, function () {
    console.log('listening on port:' + (process.env.PORT || 3000));
});
