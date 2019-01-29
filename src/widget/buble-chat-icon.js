import {h, Component} from 'preact';
import {icon} from '@fortawesome/fontawesome-svg-core'
import faFreeRegular from '@fortawesome/fontawesome-free-regular'

export default class BubbleChatIcon extends Component {

    render({isOpened, avatar}) {
        const iconComment = faFreeRegular.faComment;
        const i = icon(iconComment);
        const styleAvatar = {
            width: 42,
            height: 42,
            borderRadius: '50%'
        }
        return (
            <div style={{float: 'left'}}>
                {
                    (isOpened) ?
                        <div></div>
                        :
                        <div id="icon-chat-wrap" style={{paddingRight: '7px'}}>
                            <div id="icon-chat" dangerouslySetInnerHTML={{__html: i.html}}></div>
                            <div id="avatar-chat" style={{display: 'none'}}>
                                <img src={avatar} style={styleAvatar}/>
                            </div>
                        </div>
                }
            </div>
        );
    }
}
