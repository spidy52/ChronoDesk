import axios from 'axios';

const API = 'http://localhost:5000/api/timesheets';

export const fetchTimesheets = async () => {
  const { data } = await axios.get(API);
  return data.timesheets || [];
};

export const createTimesheet = async (entry: any) => {
  const { data } = await axios.post(API, entry);
  return data.timesheet;
};
