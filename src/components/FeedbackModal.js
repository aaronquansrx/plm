import { useState, useEffect } from "react";
import Feedback from "../pages/Feedback";

import Nav from 'react-bootstrap/Nav';
import { TemplateModal } from "./Modals";

export function FeedbackModalNav(props){
    const [isOpen, setIsOpen] = useState(false);
    function handleOpen(){
        setIsOpen(true);
    }
    const body = <Feedback/>
    function handleClose(){
        setIsOpen(false);
    }
    return(
        <>
        <Nav className='nav-link NavClickable'>
            <div style={{cursor: 'pointer'}} onClick={handleOpen}>
                Feedback
            </div>
        </Nav>
        <TemplateModal show={isOpen} title={'Feedback'} body={body} onClose={handleClose}/>
        </>
    );
}