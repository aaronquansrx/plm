import React, {useEffect, useState, useMemo, useRef} from 'react';
import {TextControl} from '../components/Forms';

import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Tooltip from 'react-bootstrap/Tooltip';
import Overlay from 'react-bootstrap/Overlay';

import { getPLMRequest, postPLMRequest } from '../scripts/APICall';

function Feedback(props){
    const [feedbackContents, setFeedbackContents] = useState({subject: '', body: ''});
    const [message, setMessage] = useState(null);
    const target = useRef(null);
    function handleChangeTitle(tx){
        setFeedbackContents(update(feedbackContents, {
            subject: {$set: tx}
        }));
    }
    function handleChangeContents(tx){
        setFeedbackContents(update(feedbackContents, {
            body: {$set: tx}
        }));
    }
    function handleSubmit(){
        setMessage('Sending feedback...');
        postPLMRequest('errorreport', {type: 'feedback', body: feedbackContents.body,
        subject: feedbackContents.subject}, 
        (res)=> {
            console.log(res.data);
            setMessage('Feedback successfully sent');
            setFeedbackContents({subject: '', body: ''});
            setTimeout(() => {setMessage(null)}, 2000);
        },
        (res)=> {
            console.log(res.data);
            setMessage('Server Error sending feedback');
            setTimeout(() => {setMessage(null)}, 2000);
        });
    }
    return(
        <>
        <Form>
        <Form.Label>Subject</Form.Label>
        <TextControl onChange={handleChangeTitle}/>
        </Form>
        <Form>
        <Form.Label>Body</Form.Label>
        <TextControl onChange={handleChangeContents} type={'textarea'}/>
        </Form>
        <Overlay target={target.current} show={message !== null} placement={'right'}>
        {(p) => (
        <Tooltip {...p}>
            {message}
        </Tooltip>
        )}
        </Overlay>
        <Button ref={target} onClick={handleSubmit}>Send</Button>
        </>
    );
}

export default Feedback;