import {useState} from 'react';
import {Routes, Route} from "react-router-dom";

import {useClientUrl, useServerUrl} from './hooks/Urls';

import update from 'immutability-helper';
import axios from 'axios';

//import BOMInterface from './containers/BOMInterface';
import PartDetails from './pages/PartDetails';
import PartSearch from './pages/PartSearch';
import Login from './pages/Login';
import Index from './pages/Index';
import BOMMain from './pages/BOMMain';
import Excel from './pages/Excel';
import CBom from './pages/CBom';
import BOMScrub from './pages/BOMScrub';
import { MainNavbar } from './containers/Navbar';
import { VersionModal } from './components/Modals';
import useUsername from './hooks/useUsername';
import './css/App.css';
import CircularBufferTest from './pages/CircularBufferTest';

const stores = [
  {id: 'AU', label: 'AU'},
  {id: 'MY', label: 'MY'}
];
const currencies = [
  {id: 'USD', label: 'USD'},
  {id: 'AUD', label: 'AUD'},
  {id: 'MYR', label: 'MYR'}
];

//use this
const pages = [
  {path: 'bomtool', title: 'BOM Tool', element: (o,l,u) => <BOMMain options={o} changeLock={l} user={u}/>},
  {path: 'cbom', title: 'CBOM Exporter', element: () => <CBom/>},
  {path: 'partsearch', title: 'Part Search (new)', element: () => <PartSearch/>},
  {path: 'bomscrub', title: 'BOM Scrub (new)', element: () => <BOMScrub/>}
];

const inProduction = process.env.NODE_ENV === 'production';

function App() {
  const serverUrl = useServerUrl();
  const [saveUsername, username] = useUsername();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [options, setOptions] = useState({store: stores[0].id, currency: currencies[0].id});
  const [dataProcessLock, setDataProcessLock] = useState(false);
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
    if(username){
      axios({
        method: 'GET',
        url: serverUrl+'api/changeoptions',
        params: {username: username, store:st, currency: curr}
      }).then(response => {
        console.log(response.data);
      });
    }
  }
  function handleLogin(u, pw){
    axios({
        method: 'POST',
        url: serverUrl+'api/login',
        data: {username: u, password: pw, store: options.store, currency: options.currency},
    }).then(response => {
        console.log(response.data);
        const data = response.data;
        setOptions({store: data.store, currency: data.currency});
        saveUsername(u);
    });
  }
  function handleLogout(){
    axios({
      method: 'POST',
      url: serverUrl+'api/logout',
      data: {username: username},
    }).then(response => {
      console.log(response.data);
      saveUsername(false);
    });
  }
  function handleVersionClick(){
    const version = true;
    setShowVersionModal(version);
  }
  function handleHideVersion(){
    setShowVersionModal(false);
  }
  function path(p){
    const prePath = inProduction ? process.env.REACT_APP_CLIENT_PATH : process.env.REACT_APP_TEST_PATH;
    return prePath+'/'+p;
  }
  return (
    <div className="App">
      <MainNavbar username={username} version={versions[0].current} pages={pages}
      onVersionClick={handleVersionClick}
      store={options.store} currency={options.currency} 
      onOptionChange={handleOptionChange}
      stores={stores} currencies={currencies}
      dataProcessLock={dataProcessLock} onLogin={handleLogin} onLogout={handleLogout}/>
      {showVersionModal && <VersionModal show={showVersionModal} versions={versions} hideAction={handleHideVersion}/>}
      <Routes>
        <Route path={path('')} element={<Index/>}/>
        {/*
        <Route path={path('bomtool')} element={<BOMMain options={options} changeLock={handleLock} user={username}/>}/>
        <Route path={path('cbom')} element={<CBom/>}/>
        <Route path={path('partsearch')} element={<PartSearch/>}/>
        <Route path={path('bomscrub')} element={<BOMScrub/>}/>
        */}
        {pages.map((page, i) => {
          return <Route key={i} path={path(page.path)} element={page.element(options, handleLock, username)} />
        })}
        <Route path={path('login')} element={<Login onLogin={handleLogin}/>}/>
        <Route path={path('partdetails/:partId')} element={<PartDetails/>}/>
        <Route path={path('excel')} element={<Excel/>}/>
        {!inProduction && <Route path={path('circular')} element={<CircularBufferTest/>}/>}
      </Routes>
    </div>
  );
}

const versions = [
  {
      current: '1.2.2',
      name: '1.2',
      content:
      <div>
          <h3>Version 1.2.0</h3>
          <p>Excess quantity and price evaluation</p>
          <p>Internal algorithm changes and structural overhaul</p>
          <h5>1.2.1</h5>
          <p>Octopart request</p>
          <h5>1.2.2</h5>
          <p>Fees</p>
          <p>Single part search</p>
          <p>BOM Scrub alpha test</p>
      </div>
  },
  {
      name: '1.1',
      content: 
      <div>
          <h3>Version 1.1</h3>
          <p>
              New CBOM exporter - drag and drop a CBOM file with completed master file and export with a filled CBOM
          </p>
          <p>
              Login system
          </p>
          
      </div>
  },
  {
      name: '1.0',
      content: 
      <div>
          <h3>Version 1.0</h3>
          <p>
              Full stable release of BOM Tool
          </p>
          <p>
              Introducing user options - quantity multiplier, in stock only, API filtering, line locking, and MPN options
          </p>
          <p>
              Exporting of offer data into an excel file
          </p>
          <p>
              Improved reliability of input files and data
          </p>
          <p>
              Choosing of region and currency options
          </p>
      </div>
  },
  {
      name: '0.0',
      content: 
      <div>
          <h3>Version 0.0</h3>
          <p>
              Demo version of BOM Tool - import a excel file and search MPNs for offers from APIs 
          </p>
      </div>
  }
];

export default App;
