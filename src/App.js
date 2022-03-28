import {useState} from 'react';
import {Routes, Route} from "react-router-dom";

import './css/App.css';
//import BOMInterface from './containers/BOMInterface';
import PartDetails from './pages/PartDetails';
import PartSearch from './pages/PartSearch';
import Login from './pages/Login';
import Index from './pages/Index';
import BOMMain from './pages/BOMMain';
import { MainNavbar } from './containers/Navbar';
import { VersionModal } from './components/Modals';
import useUsername from './hooks/useUsername';
import './css/App.css';

function App() {
  const {username, setUsername} = useUsername();
  const [showVersionModal, setShowVersionModal] = useState(false);
  //console.log(username);
  //console.log(setUsername);
  //const [loggedIn, setLoggedIn] = useState(null);
  function handleLogin(u){
    setUsername(u);
  }
  function handleLogout(){
    setUsername(false);
  }
  function handleVersionClick(){
    const version = true;
    setShowVersionModal(version);
    console.log(version);
  }
  function handleHideVersion(){
    setShowVersionModal(false);
  }
  function path(p){
    const prePath = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
    return '/'+prePath+p;
  }
  console.log(showVersionModal);
  return (
    <div className="App">
      <MainNavbar username={username} onLogout={handleLogout} onVersionClick={handleVersionClick}/>
      {showVersionModal && <VersionModal show={showVersionModal} hideAction={handleHideVersion}/>}
      <Routes>
        <Route path={path('')} element={<Index/>}/>
        <Route path={path('bomtool')} element={<BOMMain/>}/>
        <Route path={path('login')} element={<Login onLogin={handleLogin}/>}/>
        <Route path={path('partsearch')} element={<PartSearch/>}/>
        <Route path={path('partdetails/:partId')} element={<PartDetails/>}/>
      </Routes>
    </div>
  );
}

export default App;
