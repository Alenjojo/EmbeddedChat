import { Box, Button, Icon } from '@rocket.chat/fuselage';
import React, { useState, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './ChatInput.module.css';
import { EmojiPicker } from '../EmojiPicker/index';
import Popup from 'reactjs-popup';
import RCContext from '../../context/RCInstance';
import he from 'he';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';
import { useToastStore, useUserStore } from '../../store';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';

const ChatInput = ({ GOOGLE_CLIENT_ID }) => {
  const [message, setMessage] = useState('');
  const { signIn } = useGoogleLogin(GOOGLE_CLIENT_ID);
  const { RCInstance } = useContext(RCContext);
  const inputRef = useRef(null);

  const handleClickToOpenFiles = () => {
    inputRef.current.click();
  };

  const isUserAuthenticated = useUserStore(
    (state) => state.isUserAuthenticated
  );
  const setIsUserAuthenticated = useUserStore(
    (state) => state.setIsUserAuthenticated
  );

  const setUserAvatarUrl = useUserStore((state) => state.setUserAvatarUrl);
  const toastPosition = useToastStore((state) => state.position);
  const setAuthenticatedUserUsername = useUserStore(
    (state) => state.setUsername
  );

  const dispatchToastMessage = useToastBarDispatch();

  const sendMessage = async () => {
    if (!message.length || !isUserAuthenticated) {
      return;
    }
    const res = await RCInstance.sendMessage(message);
    if (!res.success) {
      await RCInstance.logout();
      setIsUserAuthenticated(false);
      dispatchToastMessage({
        type: 'error',
        message: 'Error sending message, login again',
        position: toastPosition,
      });
    }
    setMessage('');
  };

  const handleEmojiClick = (n) => {
    if (n.length > 5) {
      let flagUnifed = '&#x' + n.split('-').join(';&#x') + ';';
      let flag = he.decode(flagUnifed);
      setMessage(message + flag);
      return;
    }
    let unified_emoji = he.decode(`&#x${n};`);
    setMessage(message + unified_emoji);
  };

  const handleLogin = async () => {
    const res = await RCInstance.googleSSOLogin(signIn);
    if (res.status === 'success') {
      setUserAvatarUrl(res.me.avatarUrl);
      setAuthenticatedUserUsername(res.me.username);
      setIsUserAuthenticated(true);
      dispatchToastMessage({
        type: 'success',
        message: 'Successfully logged in',
        position: toastPosition,
      });
    } else {
      dispatchToastMessage({
        type: 'error',
        message: 'Something wrong happened',
        position: toastPosition,
      });
    }
  };

  const sendAttachment = async (event) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }
    await RCInstance.sendAttachment(event.target);
  };

  return (
    <Box className={styles.container} border={'2px solid #ddd'}>
      {isUserAuthenticated && (
        <Popup
          disabled={!isUserAuthenticated}
          trigger={<Icon name="emoji" size="x25" padding={6} />}
          position={'top left'}
        >
          <EmojiPicker handleEmojiClick={handleEmojiClick} />
        </Popup>
      )}
      <input
        placeholder={isUserAuthenticated ? 'Message' : 'Sign in to chat'}
        disabled={!isUserAuthenticated}
        value={message}
        className={styles.textInput}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.keyCode === 13) {
            sendMessage();
          }
        }}
      />
      <input type="file" hidden ref={inputRef} onChange={sendAttachment} />
      {isUserAuthenticated ? (
        message ? (
          <Icon
            disabled={!isUserAuthenticated}
            onClick={sendMessage}
            name="send"
            size="x25"
            padding={6}
          />
        ) : (
          <Icon
            disabled={!isUserAuthenticated}
            onClick={handleClickToOpenFiles}
            name="plus"
            size="x25"
            padding={6}
          />
        )
      ) : (
        <Button onClick={handleLogin} style={{ overflow: 'visible' }}>
          <Icon name="google" size="x20" padding="0px 5px 0px 0px" />
          Sign In with Google
        </Button>
      )}
    </Box>
  );
};

export default ChatInput;

ChatInput.propTypes = {
  GOOGLE_CLIENT_ID: PropTypes.string,
};
