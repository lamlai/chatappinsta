export const globalStyle = {
    fontFamily: '"Roboto", sans-serif'
}


export const desktopCloseWrapperStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 2147483647,
    borderRadius: '50px',
    background: 'rgb(229, 229, 229)',
    boxSizing: 'content-box',
    boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    minWidth: 'auto',
    transition: 1
};

export const desktopWrapperStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 2147483647,
    borderRadius: '10px',
    background: 'rgb(229, 229, 229)',
    boxSizing: 'content-box',
    boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    transition: 1
};

export const desktopClosedWrapperStyleChat = {
    position: 'fixed',
    bottom: '0px',
    right: '0px',
    zIndex: 2147483647,
    minWidth: '400px',
    boxSizing: 'content-box',
    overflow: 'hidden',
    minHeight: '120px',
    transition: 1
};

export const mobileClosedWrapperStyle = {
    position: 'fixed',
    bottom: 18,
    right: 15,
    zIndex: 999999999,
    borderRadius: '50px',
    background: 'rgb(229, 229, 229)',
    boxSizing: 'content-box',
    overflow: 'hidden',
    transition: 1
};

export const mobileOpenWrapperStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 99999999,
    width: '100%',
    height: '100%',
    background: 'rgb(229, 229, 229)',
    overflowY: 'visible',
    boxSizing: 'content-box',
    transition: 1
};

export const desktopTitleStyle = {
    lineHeight: '25px',
    fontSize: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0 5px 10px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 300
};

export const mobileTitleStyle = {
    height: 52,
    width: 52,
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    webkitBoxShadow: '1px 1px 4px rgba(101,119,134,.75)',
    boxShadow: '1px 1px 4px rgba(101,119,134,.75)'
};

export const wrapTextOnCloseInputStyle = {
    width: '100%',
    display: 'block',
    border: 'none',
    height: '37px',
    zIndex: 99,
    background: '#fafafa',
    outline: 'none',
    paddingLeft: '15px',
    paddingRight: '45px',
    color: '#666',
    fontWeight: 400,
    boxSizing: 'border-box'
}

export const wrapTextOnCloseBtnStyle = {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    color: '#666'
}

export const wrapCloseBtnStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    color: '#fff',
}

export const wrapCloseBtnTitleMobile = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    color: '#fff'
}

export const hiddenClass =  {
    display: 'none'
}