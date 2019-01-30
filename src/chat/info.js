import { h, Component } from 'preact';
import {
    InfoWrapperStyle,
    InforWrapperTextStyle,
    InfoWrapperFormInputStyle,
    InfoWrapperFormSubmitStyle
} from './style';
import { icon } from '@fortawesome/fontawesome-svg-core'
import faFreeSolid from '@fortawesome/fontawesome-free-solid'
import axios from 'axios'
const { detect } = require('detect-browser');
const browser =  detect()

export default class Info extends Component {

    state = {
        email: '',
        fullname: '',
        phone: '',
        isDisplay: false
    }
    constructor(props) {
        super(props);

    }

    componentDidMount() {
        const { socket, chatId, conf } = this.props;
        this.socket = socket;
        axios.get(conf.requestServer+'/customer/1/'+chatId)
            .then(response => {
                const customer = response.data;
                if (customer && customer.Code != 200) {
                    this.setState({ isDisplay: true });
                }

            })
    }

    render({pristine, conf}) {
        if (this.state.isDisplay) {
            const iconClose = faFreeSolid.faTimes;
            const i = icon(iconClose);
            let InfoWrapperFormSecondInputStyle = InfoWrapperFormInputStyle;
            InfoWrapperFormSecondInputStyle.marginTop = '5px';
            return (
                (this.state.isDisplay) ?
                    <div style={InfoWrapperStyle}>
                        <span class={'close-btn'} dangerouslySetInnerHTML={{ __html: i.html }} onClick={this.closeFormInfo}></span>
                        <form id={'formCustomerInformation'} onSubmit={this.handleSubmitFormCustomerInfo}>
                            <p style={InforWrapperTextStyle}>{conf.getCustomerInfoText}</p>
                            <input type={'input'} placeholder="Họ và tên" name="CustomerName" value={this.state.fullname} onChange={this.handleFullNameChange} style={InfoWrapperFormInputStyle} />
                            <input type={'input'} placeholder="Số điện thoại" name="CustomerPhone" value={this.state.phone} onChange={this.handlePhoneChange} style={InfoWrapperFormInputStyle} />
                            <input type={'email'} placeholder="Email" name="CustomerEmail" value={this.state.email} onChange={this.handleEmailChange} style={InfoWrapperFormSecondInputStyle} />
                            <input class={'btn'} type={'submit'} value={'Gửi'} style={InfoWrapperFormSubmitStyle} />
                        </form>
                    </div>
                    :
                    <div></div>
            );
        }

    }

    handleSubmitFormCustomerInfo = (e) => {
        e.preventDefault();
        let customerName = this.state.fullname.trim();
        let customerEmail = this.state.email.trim();
        let customerPhone = this.state.phone.trim();
        if (!customerName || !customerEmail || !customerPhone) {
            alert('Bạn chưa nhập đủ thông tin');
            return false;
        }

        let text = 'updateCustomerInfo::::'+customerName+'||||'+customerEmail+'||||'+browser.name + '||||' + customerPhone

        this.socket.send({text, from: 'visitor'});
        this.setState({isDisplay: false});
    }

    handleEmailChange = (e) => {
        this.setState({email: e.target.value});
    }

    handleFullNameChange = (e) => {
        this.setState({fullname: e.target.value});
    }

    handlePhoneChange = (e) => {
        if (this.checkIsPhone(e.target.value)) {
            this.setState({phone: e.target.value});
        } else {
            alert('Số điện thoại không đúng, xin vui lòng nhập lại');
            e.target.value = '';
        }

    }

    closeFormInfo = (e) => {
        this.setState({isDisplay: false});
    }

    checkIsPhone = (str) => {
        let patt = new RegExp(/^\+?1?\s*?\(?\d{3}(?:\)|[-|\s])?\s*?\d{3}[-|\s]?\d{4}$/);
        return patt.test(str);
    }

}
