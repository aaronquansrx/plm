import {useState} from 'react';
import {Routes, Route} from "react-router-dom";

import update from 'immutability-helper';

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

const stores = [
  {id: 'AU', label: 'AU'},
  {id: 'MY', label: 'MY'}
];
const currencies = [
  {id: 'USD', label: 'USD'},
  {id: 'AUD', label: 'AUD'},
  {id: 'MYR', label: 'MYR'}
];

function App() {
  const {username, setUsername} = useUsername();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [options, setOptions] = useState({store: stores[0].id, currency: currencies[0].id});
  const [dataProcessLock, setDataProcessLock] = useState(false);
  //console.log(username);
  //console.log(setUsername);
  //const [loggedIn, setLoggedIn] = useState(null);
  function handleVariableOptionChange(option, value){
    setOptions(update(options, {
      [option]: {$set: value}
    }));
  }
  function handleLock(val){
    setDataProcessLock(val);
  }
  function handleOptionChange(st, curr){
    setOptions(update(options, {
      store: {$set: st},
      currency: {$set: curr}
    }));
  }
  function handleLogin(u){
    setUsername(u);
  }
  function handleLogout(){
    setUsername(false);
  }
  function handleVersionClick(){
    const version = true;
    setShowVersionModal(version);
  }
  function handleHideVersion(){
    setShowVersionModal(false);
  }
  function path(p){
    const prePath = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
    return prePath+'/'+p;
  }
  return (
    <div className="App">
      <MainNavbar username={username} 
      onLogout={handleLogout} onVersionClick={handleVersionClick}
      store={options.store} currency={options.currency} 
      onOptionChange={handleOptionChange}
      stores={stores} currencies={currencies}
      dataProcessLock={dataProcessLock}/>
      {showVersionModal && <VersionModal show={showVersionModal} hideAction={handleHideVersion}/>}
      <Routes>
        <Route path={path('')} element={<Index/>}/>
        <Route path={path('bomtool')} element={<BOMMain options={options} changeLock={handleLock}/>}/>
        <Route path={path('login')} element={<Login onLogin={handleLogin}/>}/>
        <Route path={path('partsearch')} element={<PartSearch/>}/>
        <Route path={path('partdetails/:partId')} element={<PartDetails/>}/>
      </Routes>
    </div>
  );
}

export default App;
