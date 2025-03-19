import { io } from 'socket.io-client';
import baseUrl from './config/config';

const socket = io('http://localhost:5300', {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  if (reason === "io server disconnect") {
    // Reconnect manually
    socket.connect();
  }
});

socket.on("connect_error", (error) => {
  console.log("Connection error:", error);
  setTimeout(() => {
    socket.connect();
  }, 1000); // Retry after 1 second
});

export default socket;