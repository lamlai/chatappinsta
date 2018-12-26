import * as store from 'store'
import io from 'socket.io-client'

import {h, Component} from 'preact';
import MessageArea from './message-area';
import Info from './info';
import {icon} from '@fortawesome/fontawesome-svg-core'
import faFreeRegular from '@fortawesome/fontawesome-free-regular'
import faFreeSolid from '@fortawesome/fontawesome-free-solid'
import axios from 'axios'

export default class Chat extends Component {

    autoResponseState = 'pristine'; // pristine, set or canceled
    autoResponseTimer = 0;

    constructor(props) {
        super(props);
        this.state.selectedFile = null;
        this.state.uploading = false;
        if (store.enabled) {
            this.messagesKey = 'messages' + '.' + props.chatId + '.' + props.host;
            this.state.messages = store.get(this.messagesKey) || store.set(this.messagesKey, []);
        } else {
            this.state.messages = [];
        }
        this.socket = io.connect();
        this.socket.on('connect', () => {
            this.socket.emit('register', {chatId: this.props.chatId, userId: this.props.userId});
        });
        this.socket.on(this.props.chatId, this.incomingMessage);
        this.socket.on(this.props.chatId + '-' + this.props.userId, this.incomingMessage);

        if (!this.state.messages.length) {
            this.writeToMessages({text: this.props.conf.introMessage, from: 'admin'});
        }

    }

    render({}, state) {
        const iconPaperPlan = faFreeRegular.faPaperPlane;
        const paperPlan = icon(iconPaperPlan);
        const iconPaperClip = faFreeSolid.faPaperclip;
        const paperClip = icon(iconPaperClip);
        return (
            <div style={{position: 'relative'}}>
                <MessageArea messages={state.messages} conf={this.props.conf}/>
                <Info pristine={this.state.autoResponseState} conf={this.props.conf} targetChatId={this.props.chatId}
                      chatId={this.props.userId} socket={this.socket}/>
                <input id="inputTextarea" class="textarea" type="text" placeholder={this.props.conf.placeholderText}
                       ref={(input) => {
                           this.input = input
                       }}
                       onKeyPress={this.handleKeyPress}/>

                <label class="btn-send-file">
                    <span dangerouslySetInnerHTML={{__html: paperClip.html}}></span>
                    <input class="hidden" onChange={this.handleUploadFileChat} type="file" name="uploadFileChat"/>
                </label>

                <span class="btn-send-message" onClick={this.handleSendMessageClick}
                      dangerouslySetInnerHTML={{__html: paperPlan.html}}></span>
                <div class="background-bottom-input-area"/>
            </div>

        );
    }

    handleKeyPress = (e) => {
        if (e.keyCode == 13 && this.input.value) {
            let text = this.input.value;
            this.sendMessage(text)
        }
    };

    handleSendMessageClick = () => {
        let textMessage = document.getElementById('inputTextarea').value;
        this.sendMessage(textMessage);
    }

    handleUploadFileChat = (e) => {
        this.setState({
            selectedFile: e.target.files[0],
            loaded: 0,
            uploading: true
        })
        const data = new FormData()
        data.append('file', this.state.selectedFile, this.state.selectedFile.name)
        axios
            .post('/customer/upload/' + this.props.conf.urlRequest + '/' + this.props.userId, data, {
                onUploadProgress: ProgressEvent => {
                    this.setState({
                        loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                    })
                    if (this.state.loaded == 100) {
                        this.setState({
                            uploading: false
                        })
                    }
                },
            })
            .then(res => {
                this.socket.send({text: 'Đã gửi một file', from: 'visitor', visitorName: this.props.conf.visitorName});
            })

    }

    sendMessage = (text) => {
        if (text) {
            this.socket.send({text, from: 'visitor', visitorName: this.props.conf.visitorName});
            this.input.value = '';

            if (this.autoResponseState === 'pristine') {

                setTimeout(() => {
                    this.writeToMessages({
                        text: this.props.conf.autoResponse,
                        from: 'admin'
                    });
                }, 500);

                this.autoResponseTimer = setTimeout(() => {
                    this.writeToMessages({
                        text: this.props.conf.autoNoResponse,
                        from: 'admin'
                    });
                    this.autoResponseState = 'canceled';
                }, 60 * 1000);
                this.autoResponseState = 'set';
            }
        }
    }

    incomingMessage = (msg) => {
        this.writeToMessages(msg);
        if (msg.from === 'admin') {
            document.getElementById('messageSound').play();

            if (this.autoResponseState === 'pristine') {
                this.autoResponseState = 'canceled';
            } else if (this.autoResponseState === 'set') {
                this.autoResponseState = 'canceled';
                clearTimeout(this.autoResponseTimer);
            }
        }
    };

    writeToMessages = (msg) => {
        msg.time = new Date();
        this.setState({
            message: this.state.messages.push(msg)
        });

        if (store.enabled) {
            try {
                store.transact(this.messagesKey, function (messages) {
                    messages.push(msg);
                });
            } catch (e) {
                console.log('failed to add new message to local storage', e);
                store.set(this.messagesKey, [])
            }
        }
    }
}
