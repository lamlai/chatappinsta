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
const fs = require('fs-extra');
const progress = require('request-progress');
require('dotenv').config()

app.use(express.static('dist', {index: 'demo.html', maxage: '4h'}));
app.use(bodyParser.json());
app.use(fileUpload());

// handle admin Telegram messages
app.post('/hook', function (req, res) {
    try {
        if(req.body.callback_query) {
            handleUpdateStatusBillForWeb(req.body.callback_query)
        } else {
            const message = req.body.message || req.body.channel_post;
            const chatId = message.chat.id;
            const name = message.from.first_name + ' ' + message.from.last_name || message.chat.title || 'admin';
            let text = message.text || '';
            const reply = message.reply_to_message;
            let arrMineTypeImage = ['image/jpeg', 'image/png'];
            if ((message.document && arrMineTypeImage.indexOf(message.document.mime_type) ) || message.photo ) {
                let fileId;
                if (message.photo) {
                    fileId = message.photo[3].file_id
                } else {
                    fileId = message.document.file_id
                }

                let urlGetFile =  'https://api.telegram.org/bot' + process.env.TELEGRAM_TOKEN + '/getFile?file_id=' + fileId
                    request
                        .get({url: urlGetFile},
                            function (error, response, body){
                            body = JSON.parse(body)
                            if (body.ok) {
                                let filePath = body.result.file_path;
                                let fileName = filePath.replace('documents/' , '');
                                let now = new Date();
                                fileName = fileName.replace('photos/' , '');
                                let newUrlImage = 'https://api.telegram.org/file/bot' + process.env.TELEGRAM_TOKEN + '/' + filePath;
                                fileName = date.format(now, 'YYYYMMDDHHmmss') + '_' + fileName;
                                const savedFile = `${__dirname}/media/upload/${fileName}`;
                                downloadImage(newUrlImage, savedFile, function (state) {}, function (response) {}, function (error) {
                                }, function () {
                                    fs.copy(savedFile, __dirname + '/dist/media/upload/' + fileName)
                                        .then(() => {
                                            if (reply) {
                                                let fullImageUrlOwnHost = process.env.HOST+ '/media/upload/' + fileName;
                                                let replyText = reply.text || '';
                                                let userId = replyText.split(':')[0];
                                                userId = userId.split(' - ')[0];
                                                let imageRender = '<br><img src="'+fullImageUrlOwnHost+'">';
                                                text += imageRender;
                                                io.emit(chatId + '-' + userId, {name, text, from: 'admin'});
                                            }

                                        })
                                        .catch(err => console.error(err));
                                })
                            }
                        })

            } else {
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
                }
            }

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

        client.on('message', function (msg) {
            if (msg.text.startsWith('updateCustomerInfo::::')) {
                let customerInfo = msg.text.split('::::')[1];
                let arrCustomerInfo = customerInfo.split('||||');
                let customerFullname = arrCustomerInfo[0];
                let customerEmail = arrCustomerInfo[1];
                let browserType = arrCustomerInfo[2];
                let customerPhone = arrCustomerInfo[3];
                let alertMessage = '';
                alertMessage += userId + ' đã cập nhật thông tin: \n';
                alertMessage += 'Họ tên: '+customerFullname + '\n';
                alertMessage += 'Số điện thoại: '+customerPhone + '\n';
                alertMessage += 'Email: '+customerEmail + '\n';
                alertMessage += 'Loại trình duyệt: '+browserType + '\n';

                const customer = Customer.findOne({where: {chat_id: userId}});
                customer.then(function (customer) {
                    if (!customer) {
                        Customer.create({
                            fullname: customerFullname,
                            email: customerEmail,
                            phone: customerPhone,
                            chat_id: userId,
                            target_chat_id: chatId,
                            website_id: 1
                        })
                    }
                })
                sendTelegramMessage(chatId, alertMessage, 'Markdown')

            } else {
                const customer = Customer.findOne({where: {chat_id: userId}});
                customer.then(function (customer) {
                    let visitorName = userId;
                    if (customer) {
                        visitorName = customer.fullname + ' - ' + customer.email
                    }
                    messageReceived = true;
                    io.emit(chatId + '-' + userId, msg);
                    if (visitorName != userId) {
                        sendTelegramMessage(chatId, userId+' - *'+visitorName+'*' + ': ' + msg.text, 'Markdown');
                    } else {
                        sendTelegramMessage(chatId, userId+': ' + msg.text, 'Markdown');
                    }

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

function sendTelegramBride(form) {
    let rsp = request
        .post('https://api.telegram.org/bot' + process.env.TELEGRAM_TOKEN + '/sendMessage')
        .form(form);
    return rsp;
}

function sendTelegramFile(chatId, file, customerId , customer, parseMode='Markdown') {
    const formData = {
        chat_id: chatId,
        document: fs.createReadStream(file),
        caption: customerId+' - *'+ customer + '* Đã gửi file đính kèm',
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

function handleUpdateStatusBillForWeb(data) {
    const params = data.data.split('||')
    const apiAction = '/index.php?rest_route=/toi-route/update-order-status';
    const fullUrlRequest = params[0]+apiAction;
    const chatId = data.message.chat.id || data.from.id;
    let form = {
        key: params[1],
        confirm: params[2]
    }
    request
        .post({
            url: fullUrlRequest,
            form: form
        }, function (error, response, body) {
            body = JSON.parse(body);
            if (body.Code && body.Code == 200) {
                sendTelegramMessage(chatId,body.Message + ' \n Người thao tác: '+data.from.first_name + ' '+data.from.last_name, 'Markdown')
            } else {
                sendTelegramMessage(chatId, 'Có lỗi trong quá trình thao tác, xin vui lòng thử lại')
            }
        })
}

function downloadImage (uri, path, onProgress, onResponse, onError, onEnd) {
    progress(request(uri))
        .on('progress', onProgress)
        .on('response', onResponse)
        .on('error', onError)
        .on('end', onEnd)
        .pipe(fs.createWriteStream(path))
};

function copyFile(source, target) {
    var rd = fs.createReadStream(source);
    var wr = fs.createWriteStream(target);
    return new Promise(function(resolve, reject) {
        rd.on('error', reject);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    }).catch(function(error) {
        rd.destroy();
        wr.end();
        throw error;
    });
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
                            const sendImage = sendTelegramFile(chatId, savedFile, customerId ,customerName)
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

app.post('/send-order', (req, res) => {
    let rsp = {
        'Code': 400,
        'Success': 0,
        'Data': {}
    }
    if (req.body.chat_id) {
        sendTelegramBride(req.body)
        rsp.Code = 200
    }
    res.json(rsp);
})

http.listen(process.env.PORT || 3000, function () {
    console.log('listening on port:' + (process.env.PORT || 3000));
});
