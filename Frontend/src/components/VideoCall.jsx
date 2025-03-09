import React, { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import socket from "../socket";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaShareSquare,
  FaDesktop,
  FaUsers,
  FaCopy,
  FaCheck,
  FaPhone,
} from "react-icons/fa";
import "../assets/VideoCall.css";

/**
 * VideoCall Component - Implements a peer-to-peer video call using WebRTC and Socket.IO
 * Supports two users per call room with audio/video toggling and screen sharing
 */
const VideoCall = () => {
  // Get user ID from token
  const token = localStorage.getItem("accessToken");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
  console.log("Current user ID:", userId);

  // State for managing streams and connections
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState({});
  const [roomId, setRoomId] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState("Enter Room ID to Join Call");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Refs for persistent values that don't cause re-renders
  const localVideoRef = useRef(); // Reference to local video element
  const peersRef = useRef({}); // Store peer connections
  const screenStreamRef = useRef(null); // Reference to screen sharing stream
  const roomRef = useRef(""); // Store room ID in ref to access in cleanup functions

  // Effect to handle socket connection state
  useEffect(() => {
    console.log("Setting up socket connection handlers");

    // Handle socket connection
    const onConnect = () => {
      console.log("Socket connected in VideoCall component, ID:", socket.id);
      setIsConnected(true);

      // If we were in a call, rejoin the room after reconnection
      if (roomRef.current && localStream) {
        console.log("Rejoining room after reconnection:", roomRef.current);
        socket.emit("join-room", roomRef.current, userId);
      }
    };

    // Handle socket disconnection
    const onDisconnect = () => {
      console.log("Socket disconnected in VideoCall component");
      setIsConnected(false);
      setStatus("Connection lost. Trying to reconnect...");
    };

    // Register socket event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Check current connection status
    console.log("Initial socket connection status:", socket.connected);

    // Cleanup event listeners on component unmount
    return () => {
      console.log("Cleaning up socket connection handlers");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [userId, localStream]);

  /**
   * Generate a random room ID for new calls
   * @returns {string} A random room identifier
   */
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 12);
    console.log("Generated room ID:", randomId);
    setRoomId(randomId);
    return randomId;
  };

  /**
   * Copy room ID to clipboard for sharing
   */
  const copyRoomId = () => {
    const roomToCopy = roomRef.current || roomId;
    console.log("Copying room ID to clipboard:", roomToCopy);
    navigator.clipboard.writeText(roomToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Create or join a video call room
   * @param {boolean} create Whether to create a new room (true) or join existing (false)
   */
  const joinRoom = (create = false) => {
    const roomToJoin = create ? generateRoomId() : roomId.trim();

    if (roomToJoin) {
      console.log(`${create ? "Creating" : "Joining"} room:`, roomToJoin);
      setIsCallActive(true);
      setStatus(`Preparing to join room: ${roomToJoin}`);
      roomRef.current = roomToJoin;
      initializeCall(roomToJoin);
    } else {
      console.warn("Attempted to join room with empty ID");
      alert("Please enter a valid room ID.");
    }
  };

  /**
   * Handle starting a new call (creates new room)
   */
  const startNewCall = () => {
    console.log("Starting new call");
    joinRoom(true);
  };

  /**
   * Initialize media devices and socket connections for the call
   * @param {string} roomToJoin The room ID to join
   */
  const initializeCall = async (roomToJoin) => {
    try {
      console.log("Requesting media permissions...");
      // Request media with lower constraints to ensure it works on more devices
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: true,
      });

      console.log(
        "Media access granted:",
        stream
          .getTracks()
          .map((t) => ({ kind: t.kind, id: t.id, enabled: t.enabled }))
      );

      // Set local stream
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("Local video stream set to video element");
      } else {
        console.warn("Local video ref is not available");
      }

      setStatus(`Joining room: ${roomToJoin}`);

      // Clean up any existing listeners to avoid duplicates
      cleanupSocketListeners();

      // Setup socket event handlers for video calling
      setupSocketListeners(roomToJoin, stream);

      // Join the room
      console.log("Emitting join-room event:", { roomId: roomToJoin, userId });
      socket.emit("join-room", roomToJoin, userId);
    } catch (error) {
      console.error("Error initializing call:", error);
      setStatus(
        `Error: ${error.message}. Please ensure camera and microphone permissions are granted.`
      );
      setIsCallActive(false);
    }
  };

  /**
   * Set up all socket event listeners for video calling
   * @param {string} roomToJoin The room ID being joined
   * @param {MediaStream} stream Local media stream to share
   */
  const setupSocketListeners = (roomToJoin, stream) => {
    console.log("Setting up socket listeners for video call");

    // Add handler for when a room is full
    socket.on("room-full", (fullRoomId) => {
      console.log(`Room ${fullRoomId} is full`);
      setStatus("Room is full. Only 2 participants are allowed per call.");
      endCall(); // Call the endCall function to clean up
    });

    // Listen for users already in the room
    socket.on("room-users", (users) => {
      console.log("Received room-users event. Users in room:", users);
      setUsersInRoom(users);
      setStatus(
        `Connected to room ${roomToJoin}. ${users.length} other user(s) here.`
      );

      // Create peers for each existing user
      users.forEach((remoteUserId) => {
        if (remoteUserId !== userId && !peersRef.current[remoteUserId]) {
          console.log(
            "Creating initiator peer for existing user:",
            remoteUserId
          );
          const peer = createPeer(
            remoteUserId,
            userId,
            stream,
            true,
            roomToJoin
          );
          peersRef.current[remoteUserId] = peer;
          setRemotePeers((prev) => ({
            ...prev,
            [remoteUserId]: { peer, stream: null },
          }));
        }
      });
    });

    // Listen for new users connecting
    socket.on("user-connected", (remoteUserId) => {
      console.log("User connected to room:", remoteUserId);
      if (remoteUserId !== userId) {
        setStatus(`${remoteUserId} joined the call`);
        setUsersInRoom((prev) => [...prev, remoteUserId]);
        // Note: We don't create a peer here - wait for them to send an offer
      }
    });

    // Handle incoming offers
    socket.on("receive-offer", ({ offer, fromUserId, roomId }) => {
      console.log("Received WebRTC offer from:", fromUserId);
      if (fromUserId !== userId) {
        // Check if we already have a peer for this user
        if (peersRef.current[fromUserId]) {
          console.log("Already have a peer for this user, using existing peer");
          peersRef.current[fromUserId].signal(offer);
        } else {
          console.log("Creating new non-initiator peer to answer offer");
          const peer = createPeer(fromUserId, userId, stream, false, roomId);
          peer.signal(offer);
          peersRef.current[fromUserId] = peer;
          setRemotePeers((prev) => ({
            ...prev,
            [fromUserId]: { peer, stream: null },
          }));
        }
      }
    });
    
    // Handle incoming answers
    socket.on("receive-answer", ({ answer, fromUserId }) => {
      console.log("Received WebRTC answer from:", fromUserId);
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal(answer);
        console.log("Applied answer to peer connection");
      } else {
        console.warn("Received answer but no peer exists for:", fromUserId);
      }
    });

    // Handle ICE candidates
    socket.on("receive-ice-candidate", ({ candidate, fromUserId }) => {
      console.log("Received ICE candidate from:", fromUserId);
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal({ candidate });
        console.log("Applied ICE candidate to peer connection");
      } else {
        console.warn(
          "Received ICE candidate but no peer exists for:",
          fromUserId
        );
      }
    });

    // Handle user disconnection
    socket.on("user-disconnected", (remoteUserId) => {
      console.log("User disconnected from room:", remoteUserId);
      setStatus(`${remoteUserId} left the call`);

      if (peersRef.current[remoteUserId]) {
        console.log("Destroying peer connection for disconnected user");
        peersRef.current[remoteUserId].destroy();
        delete peersRef.current[remoteUserId];

        setRemotePeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[remoteUserId];
          return newPeers;
        });

        setUsersInRoom((prev) => prev.filter((id) => id !== remoteUserId));
      }
    });
  };

  /**
   * Clean up socket listeners to prevent duplicates and memory leaks
   */
  const cleanupSocketListeners = () => {
    console.log("Cleaning up socket listeners");
    socket.off("room-full");
    socket.off("room-users");
    socket.off("user-connected");
    socket.off("receive-offer");
    socket.off("receive-answer");
    socket.off("receive-ice-candidate");
    socket.off("user-disconnected");
  };

  /**
   * Create a WebRTC peer connection
   * @param {string} remoteUserId ID of the remote user to connect with
   * @param {string} myUserId ID of the local user
   * @param {MediaStream} stream Local media stream to share
   * @param {boolean} initiator Whether this peer is the one initiating the connection
   * @param {string} roomId ID of the room for this connection
   * @returns {SimplePeer} The created peer connection object
   */
  const createPeer = (remoteUserId, myUserId, stream, initiator, roomId) => {
    console.log(
      `Creating peer connection. Initiator: ${initiator}, Remote user: ${remoteUserId}, Room: ${roomId}`
    );

    // Create the peer with ICE servers for NAT traversal
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:relay.metered.ca:80",
            username: "83e06c3061468401a5d196df",
            credential: "rJ+iGQKFWKWH4mBl",
          },
          {
            urls: "turn:relay.metered.ca:443",
            username: "83e06c3061468401a5d196df",
            credential: "rJ+iGQKFWKWH4mBl",
          },
        ],
      },
    });

    // Handle signaling events (offer/answer exchange)
    peer.on("signal", (data) => {
      console.log(
        `Generated ${initiator ? "offer" : "answer"} signal for ${remoteUserId}`
      );

      // Send offer/answer to the remote peer via server
      socket.emit(initiator ? "send-offer" : "send-answer", {
        [initiator ? "offer" : "answer"]: data,
        toUserId: remoteUserId,
        fromUserId: myUserId,
        roomId,
      });
    });

    // Handle incoming media stream from remote peer
    peer.on("stream", (remoteStream) => {
      console.log(
        "Received remote stream from:",
        remoteUserId,
        remoteStream.getTracks().map((t) => t.kind)
      );
      setRemotePeers((prev) => ({
        ...prev,
        [remoteUserId]: { ...prev[remoteUserId], stream: remoteStream },
      }));
    });

    // Handle peer connection errors
    peer.on("error", (err) => {
      console.error("Peer connection error with", remoteUserId, ":", err);
      setStatus(`Connection error: ${err.message}`);
    });

    // Handle peer connection close
    peer.on("close", () => {
      console.log("Peer connection closed with:", remoteUserId);
    });

    // Debug ICE connection state changes
    peer.on("iceStateChange", (state) => {
      console.log(`ICE state change with ${remoteUserId}: ${state}`);
    });

    return peer;
  };

  /**
   * Toggle microphone mute status
   */
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled;
        audioTracks[0].enabled = enabled;
        setIsMuted(!enabled);
        console.log(`Microphone ${enabled ? "unmuted" : "muted"}`);
      } else {
        console.warn("No audio tracks found in local stream");
      }
    }
  };

  /**
   * Toggle camera on/off status
   */
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled;
        videoTracks[0].enabled = enabled;
        setIsVideoOn(enabled);
        console.log(`Camera ${enabled ? "enabled" : "disabled"}`);
      } else {
        console.warn("No video tracks found in local stream");
      }
    }
  };

  /**
   * Toggle screen sharing on/off
   * Replaces the video track with screen content or reverts back to camera
   */
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      console.log("Stopping screen sharing");
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          console.log(`Stopping screen track: ${track.kind}, id: ${track.id}`);
          track.stop();
        });
        screenStreamRef.current = null;
      }

      // Restore camera video for all peers
      Object.keys(peersRef.current).forEach((peerId) => {
        const peer = peersRef.current[peerId];
        console.log(`Restoring camera video for peer: ${peerId}`);

        // Replace the screen share track with the camera track
        if (localStream && peer && peer.streams && peer.streams.length > 0) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack && peer.streams[0].getVideoTracks().length > 0) {
            console.log("Replacing screen track with camera track");
            peer.replaceTrack(
              peer.streams[0].getVideoTracks()[0],
              videoTrack,
              peer.streams[0]
            );
          } else {
            console.warn("Missing video tracks for track replacement");
          }
        } else {
          console.warn("Cannot restore camera - missing stream or peer");
        }
      });

      setIsScreenSharing(false);
      setStatus("Screen sharing stopped");
    } else {
      try {
        console.log("Starting screen sharing - requesting display media");
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        console.log(
          "Screen sharing media obtained:",
          screenStream.getTracks().map((t) => ({ kind: t.kind, id: t.id }))
        );

        screenStreamRef.current = screenStream;

        // Replace camera video with screen sharing for all peers
        Object.keys(peersRef.current).forEach((peerId) => {
          const peer = peersRef.current[peerId];
          console.log(`Replacing camera with screen for peer: ${peerId}`);

          if (peer && peer.streams && peer.streams.length > 0) {
            const screenTrack = screenStream.getVideoTracks()[0];
            if (screenTrack && peer.streams[0].getVideoTracks().length > 0) {
              console.log("Replacing camera track with screen track");
              peer.replaceTrack(
                peer.streams[0].getVideoTracks()[0],
                screenTrack,
                peer.streams[0]
              );
            } else {
              console.warn("Missing video tracks for track replacement");
            }
          } else {
            console.warn("Cannot share screen - missing stream or peer");
          }
        });

        // Handle when user stops sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          console.log("Screen sharing ended via browser UI");
          toggleScreenSharing();
        };

        setIsScreenSharing(true);
        setStatus("Screen sharing started");
      } catch (error) {
        console.error("Error sharing screen:", error);
        setStatus(`Screen sharing error: ${error.message}`);
      }
    }
  };

  /**
   * End the current call and clean up resources
   */
  const endCall = () => {
    console.log("Ending call");

    // Clean up all peer connections
    Object.keys(peersRef.current).forEach((peerId) => {
      if (peersRef.current[peerId]) {
        console.log(`Destroying peer connection with: ${peerId}`);
        peersRef.current[peerId].destroy();
        delete peersRef.current[peerId];
      }
    });

    // Stop all local streams
    if (localStream) {
      console.log("Stopping all local media tracks");
      localStream.getTracks().forEach((track) => {
        console.log(`Stopping local track: ${track.kind}, id: ${track.id}`);
        track.stop();
      });
    }

    if (screenStreamRef.current) {
      console.log("Stopping screen sharing tracks");
      screenStreamRef.current.getTracks().forEach((track) => {
        console.log(`Stopping screen track: ${track.kind}, id: ${track.id}`);
        track.stop();
      });
      screenStreamRef.current = null;
    }

    // Notify server that we're leaving the room
    if (roomRef.current) {
      console.log("Leaving room:", roomRef.current);
      socket.emit("leave-room", roomRef.current, userId);
      roomRef.current = "";
    }

    // Clean up socket listeners
    cleanupSocketListeners();

    // Reset state
    setIsCallActive(false);
    setLocalStream(null);
    setRemotePeers({});
    setStatus("Call Ended");
    setIsScreenSharing(false);
    setUsersInRoom([]);

    console.log("Call ended and resources cleaned up");
  };

  /**
   * Attempt to reconnect socket if connection is lost
   */
  const reconnect = () => {
    if (!isConnected) {
      console.log("Attempting to reconnect socket");
      socket.connect();
      setStatus("Reconnecting...");
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    console.log("Setting up component cleanup");

    // Setup function to handle beforeunload event (when user closes tab/window)
    const handleBeforeUnload = () => {
      console.log("Window unloading - cleaning up call");
      if (roomRef.current) {
        socket.emit("leave-room", roomRef.current, userId);
      }
    };

    // Add beforeunload event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Return cleanup function executed on component unmount
    return () => {
      console.log("VideoCall component unmounting - cleaning up resources");
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Destroy all peer connections
      Object.keys(peersRef.current).forEach((peerId) => {
        if (peersRef.current[peerId]) {
          console.log(`Destroying peer connection with: ${peerId}`);
          peersRef.current[peerId].destroy();
        }
      });

      // Stop media tracks
      if (localStream) {
        console.log("Stopping all local media tracks");
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (screenStreamRef.current) {
        console.log("Stopping screen sharing tracks");
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Leave room if active
      if (roomRef.current) {
        console.log("Leaving room:", roomRef.current);
        socket.emit("leave-room", roomRef.current, userId);
      }

      // Remove all socket listeners
      cleanupSocketListeners();
    };
  }, [userId]);

  // Render the correct view based on call state
  return (
    <div className="video-call-container">
      {!isCallActive ? (
        <div className="pre-call-container">
          <div className="call-card">
            <h2>Video Call</h2>
            <p className="status-text">{status}</p>

            {!isConnected && (
              <div className="connection-error">
                <p>Connection to server lost</p>
                <button onClick={reconnect} className="reconnect-button">
                  Reconnect
                </button>
              </div>
            )}

            <div className="join-options">
              <div className="input-with-button">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="room-input"
                  disabled={!isConnected}
                />
                <button
                  onClick={() => joinRoom(false)}
                  className="join-button"
                  disabled={!roomId.trim() || !isConnected}
                >
                  Join Call
                </button>
              </div>

              <div className="separator">
                <span>OR</span>
              </div>

              <button
                onClick={startNewCall}
                className="create-button"
                disabled={!isConnected}
              >
                <FaPhone className="icon" /> Start New Call
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="active-call-container">
          <div className="status-bar">
            <div className="room-info">
              <span>Room: {roomRef.current}</span>
              <button
                onClick={copyRoomId}
                className="icon-button copy-button"
                title="Copy Room ID"
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
              {!isConnected && (
                <span className="connection-status">Disconnected</span>
              )}
            </div>
            <div className="call-status">{status}</div>
            <div className="participants-toggle">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`icon-button ${showParticipants ? "active" : ""}`}
                title="Toggle Participants"
              >
                <FaUsers />
                <span className="count">{usersInRoom.length + 1}</span>
              </button>
            </div>
          </div>

          {showParticipants && (
            <div className="participants-panel">
              <h3>Participants ({usersInRoom.length + 1})</h3>
              <ul>
                <li key={userId}>
                  {userId} (You){" "}
                  {!isConnected && (
                    <span className="disconnected-label">Disconnected</span>
                  )}
                </li>
                {usersInRoom.map((user) => (
                  <li key={user}>{user}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            className={`video-grid participants-${
              Object.keys(remotePeers).length + 1
            }`}
          >
            {/* Local video */}
            <div className="video-container local-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={!isVideoOn ? "video-off" : ""}
              />
              <div className="video-label">You</div>
              {!isVideoOn && (
                <div className="video-placeholder">
                  <div className="avatar">
                    {userId ? userId.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>
              )}
              {!isConnected && (
                <div className="connection-overlay">
                  <div className="connection-message">Reconnecting...</div>
                </div>
              )}
            </div>

            {/* Remote videos */}
            {Object.entries(remotePeers).map(([peerId, { stream }]) => (
              <div className="video-container remote-video" key={peerId}>
                {stream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(element) => {
                      if (element && stream && element.srcObject !== stream) {
                        console.log(
                          `Setting remote stream for ${peerId} to video element`
                        );
                        element.srcObject = stream;
                      }
                    }}
                  />
                ) : (
                  <div className="video-placeholder connecting">
                    <div className="connecting-indicator">
                      <div className="spinner"></div>
                      <span>Connecting...</span>
                    </div>
                  </div>
                )}
                <div className="video-label">{peerId}</div>
              </div>
            ))}
          </div>

          <div className="call-controls">
            <button
              onClick={toggleMute}
              className={`control-button ${isMuted ? "active" : ""}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>

            <button
              onClick={toggleVideo}
              className={`control-button ${!isVideoOn ? "active" : ""}`}
              title={isVideoOn ? "Turn Off Video" : "Turn On Video"}
            >
              {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
            </button>

            <button
              onClick={toggleScreenSharing}
              className={`control-button ${isScreenSharing ? "active" : ""}`}
              title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              disabled={!isConnected}
            >
              {isScreenSharing ? <FaDesktop /> : <FaShareSquare />}
            </button>

            <button
              onClick={endCall}
              className="control-button end-call"
              title="End Call"
            >
              <FaPhoneSlash />
            </button>
          </div>

          {!isConnected && (
            <div className="reconnect-overlay">
              <div className="reconnect-message">
                <p>Connection lost. Trying to reconnect...</p>
                <button onClick={reconnect} className="reconnect-button">
                  Reconnect Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCall;
