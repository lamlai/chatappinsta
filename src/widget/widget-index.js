import { h, render } from 'preact';
import Widget from './widget';
import {defaultConfiguration} from './default-configuration';
import axios from 'axios';
import moment from 'moment'

if (window.attachEvent) {
    window.attachEvent('onload', injectChat);
} else {
    window.addEventListener('load', injectChat, false);
}

function injectChat() {
    if (!window.sourceServer) {
        console.error('Please set window.desinationId');
    } else {
        let root = document.createElement('div');
        root.id = 'intergramRoot';
        document.getElementsByTagName('body')[0].appendChild(root);
        const urlRequest = window.location.hostname ;
        const host = window.location.host || 'unknown-host';
        let conf = { ...defaultConfiguration, ...window.intergramCustomizations };
        conf.urlRequest = urlRequest;
        const iFrameSrc = conf.requestServer + '/chat.html';

        axios.get(conf.requestServer+'/website/'+urlRequest)
            .then((response)=>{
                if (response && response.status == 200) {
                    let data = response.data;
                    if (data.Code == 200) {
                        if (data.Data.expire_date && data.Data.expire_date != null) {
                            const expireDate = moment(data.Data.expire_date).locale('vi').format('YYYY-MM-DD')
                            const today = moment().locale('vi').format('YYYY-MM-DD')
                            if (today <= expireDate) {
                                render(
                                    <Widget destinationId={window.destinationId}
                                            host={host}
                                            isMobile={window.screen.width < 500}
                                            iFrameSrc={iFrameSrc}
                                            conf={conf}
                                    />,
                                    root
                                );

                                try {
                                    const request = new XMLHttpRequest();
                                    request.open('POST', conf.requestServer + '/usage-start?host=' + host);
                                    request.send();
                                } catch (e) { /* Fail silently */ }
                            } else {
                                axios.get(conf.requestServer+'/check_allow')
                                    .then((response)=>{
                                        if (response && response.status == 200) {
                                            let data = response.data;
                                            if (data.Code == 200) {
                                                if (data.Data.isGlobal == true) {
                                                    render(
                                                        <Widget destinationId={window.destinationId}
                                                                host={host}
                                                                isMobile={window.screen.width < 500}
                                                                iFrameSrc={iFrameSrc}
                                                                conf={conf}
                                                        />,
                                                        root
                                                    );

                                                    try {
                                                        const request = new XMLHttpRequest();
                                                        request.open('POST', conf.requestServer + '/usage-start?host=' + host);
                                                        request.send();
                                                    } catch (e) { /* Fail silently */ }
                                                }
                                            }
                                        }
                                    })
                            }
                        } else {
                            axios.get(conf.requestServer+'/check_allow')
                                .then((response)=>{
                                    if (response && response.status == 200) {
                                        let data = response.data;
                                        if (data.Code == 200) {
                                            if (data.Data.isGlobal == true) {
                                                render(
                                                    <Widget destinationId={window.destinationId}
                                                            host={host}
                                                            isMobile={window.screen.width < 500}
                                                            iFrameSrc={iFrameSrc}
                                                            conf={conf}
                                                    />,
                                                    root
                                                );

                                                try {
                                                    const request = new XMLHttpRequest();
                                                    request.open('POST', conf.requestServer + '/usage-start?host=' + host);
                                                    request.send();
                                                } catch (e) { /* Fail silently */ }
                                            }
                                        }
                                    }
                                })
                        }
                    } else {
                        axios.get(conf.requestServer+'/check_allow')
                            .then((response)=>{
                                if (response && response.status == 200) {
                                    let data = response.data;
                                    if (data.Code == 200) {
                                        if (data.Data.isGlobal == true) {
                                            render(
                                                <Widget destinationId={window.destinationId}
                                                        host={host}
                                                        isMobile={window.screen.width < 500}
                                                        iFrameSrc={iFrameSrc}
                                                        conf={conf}
                                                />,
                                                root
                                            );

                                            try {
                                                const request = new XMLHttpRequest();
                                                request.open('POST', conf.requestServer + '/usage-start?host=' + host);
                                                request.send();
                                            } catch (e) { /* Fail silently */ }
                                        }
                                    }
                                }
                            })
                    }
                }
            })





    }

}
