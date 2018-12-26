import { h, Component } from 'preact';
import { icon } from '@fortawesome/fontawesome-svg-core'
import faFreeRegular from '@fortawesome/fontawesome-free-regular'

export default class BubbleChatIcon extends Component {

    render({isOpened}) {
        const iconComment = faFreeRegular.faComment;
        const i = icon(iconComment);
        return (
            <div style={{float: 'left'}}>
                {
                    (isOpened) ?
                    <div></div>
                    :
                    <div style={{paddingRight: '7px'}} dangerouslySetInnerHTML={{ __html: i.html }} />
                }
            </div>
        );
    }
}
