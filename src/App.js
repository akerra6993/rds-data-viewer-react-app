import './component/StickyHeadTable'
import './App.css';

import React from 'react';
import StickyHeadTable from './component/StickyHeadTable';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';

function App() {
  return (
    <React.Fragment>
      <br />
      <CssBaseline />
      <Container maxWidth="lg">
        <StickyHeadTable />
      </Container>
    </React.Fragment>
    
  );
}

export default App;
