import { createConsumer } from '@rails/actioncable';

// One websocket to the API for live messages and notifications. It signs in with
// the session cookie, so it is reopened whenever someone signs in or out.
let consumer = null;

export const getConsumer = () => {
  consumer ||= createConsumer('/cable');
  return consumer;
};

export const resetConsumer = () => {
  consumer?.disconnect();
  consumer = null;
};
