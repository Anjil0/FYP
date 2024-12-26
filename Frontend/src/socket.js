import { io } from "socket.io-client";

const socket = io("http://localhost:5300");

export default socket;
