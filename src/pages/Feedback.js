import React, {useEffect, useState, useMemo} from 'react';
import {TextControl} from '../components/Forms';

import update from 'immutability-helper';
import Button from 'react-bootstrap/Button';

import { getPLMRequest, postPLMRequest } from '../scripts/APICall';

function Feedback(props){
    const [feedbackContents, setFeedbackContents] = useState({subject: '', body: ''});
    function handleChangeTitle(tx){
        setFeedbackContents(update(feedbackContents, {
            subject: {$set: tx}
        }));
        console.log(tx);
    }
    function handleChangeContents(tx){
        setFeedbackContents(update(feedbackContents, {
            body: {$set: tx}
        }));
    }
    function handleSubmit(){
        postPLMRequest('errorreport', {type: 'debug'}, 
        (res)=> {
            console.log(res.data);
        },
        (res)=> {
            console.log(res.data);
        });
    }
    return(
        <>
        <h3>Feedback</h3>
        <TextControl onChange={handleChangeTitle}/>
        <TextControl onChange={handleChangeContents} type={'textarea'}/>
        <Button onClick={handleSubmit}>Submit</Button>
        </>
    );
}

export default Feedback;