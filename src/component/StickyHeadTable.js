import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import getDbInstances from '../accessor/AWSAccessor'

const columns = [
  { id: 'id', label: 'DB identifier', minWidth: 120 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'engine', label: 'Engine', minWidth: 120 },
  { id: 'region', label: 'Region & AZ', minWidth: 80 },
  { id: 'size', label: 'Size', minWidth: 80 },
  { id: 'status', label: 'Status', minWidth: 80 },
  { id: 'cpu', label: 'CPU', minWidth: 80 },
  { id: 'activity', label: 'Current activity', minWidth: 100 },
];

function createData(instance) {
  return { 
      id: instance.DBInstanceIdentifier, 
      role: 'Instance',
      engine: instance.Engine,
      region: instance.AvailabilityZone,
      size: instance.DBInstanceClass,
      status: instance.DBInstanceStatus,
      cpu: 'TBD',
      activity: 'TBD'
    };
}

const useStyles = makeStyles({
  root: {
    width: '100%',
  },
  container: {
    maxHeight: 600,
  },
});

export default function StickyHeadTable() {
  const classes = useStyles();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = React.useState([])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  React.useEffect(() => {
    getDbInstances().then((instances) => {
      console.log(instances)
      setRows(instances.map(instance => {
        return createData(instance)
      }))
    })
  }, []);

  return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format && typeof value === 'number' ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  );
}