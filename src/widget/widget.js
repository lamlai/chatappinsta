import { h, Component } from 'preact';
import ChatFrame from './chat-frame';
import ChatFloatingButton from './chat-floating-button';
import ChatTitleMsg from './chat-title-msg';
import BubbleChatIcon from './buble-chat-icon';

import {
    desktopTitleStyle, 
    desktopCloseWrapperStyle,
    desktopWrapperStyle,
    mobileOpenWrapperStyle,
    mobileClosedWrapperStyle,
    desktopClosedWrapperStyleChat,
    wrapTextOnCloseInputStyle,
    wrapTextOnCloseBtnStyle,
    globalStyle
} from "./style";
import {icon} from '@fortawesome/fontawesome-svg-core/index';
import faFreeRegular from '@fortawesome/fontawesome-free-regular/index';

export default class Widget extends Component {

    constructor() {
        super();
        this.state.isChatOpen = false;
        this.state.pristine = true;
        this.state.wasChatOpened = this.wasChatOpened();
        this.state.expendClose = false;
    }

    componentDidMount() {
        let body = document.body;
        let el = document.documentElement;
        let windowHeight = Math.max( window.innerHeight )
        let middleHeight =  (Math.max( body.scrollHeight, body.offsetHeight,
            el.clientHeight, el.scrollHeight, el.offsetHeight ))/2;
        let breakPointUI = 0, top = 0;
        let checkElement = document.getElementById('wrap-click');
        const classBigWidgetName = 'big-widget-class'
        document.onscroll = function () {
            if (checkElement && !checkElement.classList.contains('isOpen')) {
                top = (window.pageYOffset || el.scrollTop)  - (el.clientTop || 0);
                breakPointUI = top + (windowHeight/2);
                if (breakPointUI >= middleHeight) {
                    if (!checkElement.classList.contains(classBigWidgetName)) {
                        checkElement.classList.add(classBigWidgetName)
                        checkElement.style.borderRadius = '5px'
                        checkElement.style.minWidth = '250px'
                        document.getElementById('wrap-text-on-close').style.display = 'block'
                    }
                } else {
                    if (checkElement.classList.contains(classBigWidgetName)) {
                        checkElement.classList.remove(classBigWidgetName)
                        checkElement.style.borderRadius = '50px'
                        checkElement.style.minWidth = 'auto'
                        document.getElementById('wrap-text-on-close').style.display = 'none'
                    }
                }
            }

        }

    }

    render({conf, isMobile}, {isChatOpen, pristine}) {

        const wrapperWidth = {width: conf.desktopWidth};
        const desktopHeight = (window.innerHeight - 100 < conf.desktopHeight) ? window.innerHeight - 90 : conf.desktopHeight;
        const wrapperHeight = {height: desktopHeight};

        let wrapperStyle;
        if (!isChatOpen && (isMobile || conf.alwaysUseFloatingButton)) {
            wrapperStyle = { ...mobileClosedWrapperStyle}; // closed mobile floating button
        } else if (!isMobile){
            wrapperStyle = (conf.closedStyle === 'chat' || isChatOpen || this.wasChatOpened()) ?
                (isChatOpen) ? 
                    { ...desktopWrapperStyle, ...wrapperWidth} // desktop mode, button style
                    :
                    { ...desktopCloseWrapperStyle}
                :
                { ...desktopClosedWrapperStyleChat}; // desktop mode, chat style
        } else {
            wrapperStyle = mobileOpenWrapperStyle; // open mobile wrapper should have no border
        }

        const iconPaperPlan = faFreeRegular.faPaperPlane;
        const paperPlan = icon(iconPaperPlan);

        return (
            <div style={globalStyle}>
                <div id="wrap-click" style={wrapperStyle} class={isChatOpen ? 'isOpen': ''}>
                    <link rel='stylesheet' src='https://fonts.googleapis.com/css?family=Roboto:300,400,400i,700,800&amp;subset=vietnamese' />
                    {/* Open/close button */}
                    { (isMobile || conf.alwaysUseFloatingButton) && !isChatOpen ?

                        <ChatFloatingButton color={conf.mainColor} onClick={this.onClick}/>

                        :

                        (conf.closedStyle === 'chat' || isChatOpen || this.wasChatOpened()) ?
                            <div onClick={this.onClick}>
                                <div style={{background: conf.mainColor, ...desktopTitleStyle}} >
                                    <div style={{display: 'block', alignItems: 'center', padding: '0px 10px 0px 0px'}}>
                                        <div>
                                            <BubbleChatIcon isOpened={isChatOpen}/> {isChatOpen ? conf.titleOpen : conf.titleClosed}
                                        </div>
                                    </div>
                                </div>
                                <div id="wrap-text-on-close" style="width:100%; display:none">
                                    <input type="text" style={wrapTextOnCloseInputStyle} placeholder="Trả lời..."/>
                                    <span style={wrapTextOnCloseBtnStyle} class="btn-send-message" dangerouslySetInnerHTML={{ __html: paperPlan.html }}></span>
                                </div>
                            </div>

                            :
                            <ChatTitleMsg onClick={this.onClick} conf={conf}/>
                    }

                    {/*Chat IFrame*/}
                    <div style={{
                        display: isChatOpen ? 'block' : 'none',
                        height: isMobile ? '100%' : desktopHeight
                    }}>
                        {pristine ? null : <ChatFrame {...this.props} /> }
                    </div>

                </div>
            </div>
        );
    }

    onClick = () => {
        let stateData = {
            pristine: false,
            isChatOpen: !this.state.isChatOpen,
        }
        if(!this.state.isChatOpen && !this.wasChatOpened()){
            this.setCookie();
            stateData.wasChatOpened = true;
        }
        document.getElementById('wrap-text-on-close').style.display = 'none'
        this.setState(stateData);
    }

    setCookie = () => {
        let date = new Date();
        let expirationTime = parseInt(this.props.conf.cookieExpiration);
        date.setTime(date.getTime()+(expirationTime*24*60*60*1000));
        let expires = "; expires="+date.toGMTString();
        document.cookie = "chatwasopened=1"+expires+"; path=/";
    }

    getCookie = () => {
        var nameEQ = "chatwasopened=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return false;
    }

    wasChatOpened = () => {
        return (this.getCookie() === false) ? false : true;
    }

}
