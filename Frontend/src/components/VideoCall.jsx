import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import socket from "../socket";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaShareSquare,
  FaUserCircle,
  FaSignOutAlt,
  FaUsers,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const VideoCall = () => {
  const location = useLocation();
  const { roomId, yourName, anotherPersonName } = location.state || {};
  const roomIdFromUrl = 11;
  const token = localStorage.getItem("accessToken");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null;
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState({});
  const [isCallActive, setIsCallActive] = useState(false);
  const [status, setStatus] = useState("Enter Room ID to Join Call");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [callQuality, setCallQuality] = useState("excellent");
  const [showLocalVideo, setShowLocalVideo] = useState(true);

  const localVideoRef = useRef();
  const peersRef = useRef({});
  const screenStreamRef = useRef(null);
  const roomRef = useRef(roomIdFromUrl);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      console.log("room id from useeffect",roomId)
      joinRoom();
    }
  }, [roomId]);

  // Effect to handle socket connection state
  useEffect(() => {
    const onConnect = () => {
      console.log("room id from connection",roomId)
      if (roomRef.current && localStream) {
        socket.emit("join-room", roomRef.current, userId);
      }
    };

    const onDisconnect = () => {
      setStatus("Connection lost. Trying to reconnect...");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [userId, localStream]);

  // Start call timer when call is active
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallTime((prevTime) => prevTime + 1);
      }, 1000);

      return () => {
        clearInterval(callTimerRef.current);
      };
    }
  }, [isCallActive]);

  // Format call time for display
  const formatCallTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours ? `${hours}:` : ""}${
      minutes < 10 ? `0${minutes}` : minutes
    }:${secs < 10 ? `0${secs}` : secs}`;
  };

  /**
   * Create or join a video call room
   */
  const joinRoom = () => {
    const roomToJoin = roomRef.current;
    if (roomToJoin) {
      setIsCallActive(true);
      console.log("roomid from join room function", roomToJoin);
      setStatus(`Preparing to join room: ${roomToJoin}`);
      initializeCall(roomToJoin);
    } else {
      alert("Please enter a valid room ID.");
    }
  };

  /**
   * Initialize media devices and socket connections for the call
   */
  const initializeCall = async (roomToJoin) => {
    try {
      // Request media with basic constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Set local stream
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setStatus(`Joining room: ${roomToJoin}`);

      // Clean up any existing listeners to avoid duplicates
      cleanupSocketListeners();

      // Setup socket event handlers for video calling
      setupSocketListeners(roomToJoin, stream);

      // Join the room
      socket.emit("join-room", roomToJoin, userId);
    } catch (error) {
      setStatus(
        `Error: ${error.message}. Please ensure camera and microphone permissions are granted.`
      );
      setIsCallActive(false);
    }
  };

  /**
   * Set up all socket event listeners for video calling
   */
  const setupSocketListeners = (roomToJoin, stream) => {
    // Add handler for when a room is full
    socket.on("room-full", () => {
      setStatus("Room is full. Only 2 participants are allowed per call.");
      endCall();
    });

    // Listen for users already in the room
    socket.on("room-users", (users) => {
      setStatus(`Call in progress`);

      // Create peers for each existing user
      users.forEach((remoteUserId) => {
        if (remoteUserId !== userId && !peersRef.current[remoteUserId]) {
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
      if (remoteUserId !== userId) {
        setStatus(`Another participant joined the call`);
      }
    });

    // Handle incoming offers
    socket.on("receive-offer", ({ offer, fromUserId, roomId }) => {
      if (fromUserId !== userId) {
        if (peersRef.current[fromUserId]) {
          peersRef.current[fromUserId].signal(offer);
        } else {
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
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal(answer);
      }
    });

    // Handle ICE candidates
    socket.on("receive-ice-candidate", ({ candidate, fromUserId }) => {
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal({ candidate });
      }
    });

    // Handle user disconnection
    socket.on("user-disconnected", (remoteUserId) => {
      setStatus(`A participant left the call`);

      if (peersRef.current[remoteUserId]) {
        peersRef.current[remoteUserId].destroy();
        delete peersRef.current[remoteUserId];

        setRemotePeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[remoteUserId];
          return newPeers;
        });
      }
    });
  };

  /**
   * Clean up socket listeners to prevent duplicates and memory leaks
   */
  const cleanupSocketListeners = () => {
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
   */
  const createPeer = (remoteUserId, myUserId, stream, initiator, roomId) => {
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
      socket.emit(initiator ? "send-offer" : "send-answer", {
        [initiator ? "offer" : "answer"]: data,
        toUserId: remoteUserId,
        fromUserId: myUserId,
        roomId,
      });
    });

    // Handle incoming media stream from remote peer
    peer.on("stream", (remoteStream) => {
      setRemotePeers((prev) => ({
        ...prev,
        [remoteUserId]: { ...prev[remoteUserId], stream: remoteStream },
      }));

      // Simulate network quality check
      const quality = ["fair", "good", "excellent"];
      setCallQuality(quality[Math.floor(Math.random() * quality.length)]);
    });

    // Handle peer connection errors
    peer.on("error", (err) => {
      setStatus(`Connection error: ${err.message}`);
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
        socket.emit("toggle-mute", { userId, isMuted: !enabled });
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
        socket.emit("toggle-video", { userId, isVideoOn: enabled });
      }
    }
  };

  /**
   * Toggle screen sharing on/off
   */
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // Restore camera video for all peers
      Object.keys(peersRef.current).forEach((peerId) => {
        const peer = peersRef.current[peerId];
        if (localStream && peer && peer.streams && peer.streams.length > 0) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack && peer.streams[0].getVideoTracks().length > 0) {
            peer.replaceTrack(
              peer.streams[0].getVideoTracks()[0],
              videoTrack,
              peer.streams[0]
            );
          }
        }
      });

      setIsScreenSharing(false);
      setStatus("Screen sharing stopped");
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStreamRef.current = screenStream;

        // Replace camera video with screen sharing for all peers
        Object.keys(peersRef.current).forEach((peerId) => {
          const peer = peersRef.current[peerId];
          if (peer && peer.streams && peer.streams.length > 0) {
            const screenTrack = screenStream.getVideoTracks()[0];
            if (screenTrack && peer.streams[0].getVideoTracks().length > 0) {
              peer.replaceTrack(
                peer.streams[0].getVideoTracks()[0],
                screenTrack,
                peer.streams[0]
              );
            }
          }
        });

        // Handle when user stops sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing();
        };

        setIsScreenSharing(true);
        setStatus("Screen sharing started");
      } catch (error) {
        setStatus(`Screen sharing error: ${error.message}`);
      }
    }
  };

  /**
   * Toggle local video display mode
   */
  const toggleLocalVideoDisplay = () => {
    setShowLocalVideo(!showLocalVideo);
  };

  /**
   * End the current call and clean up resources
   */
  const endCall = () => {
    // Clean up all peer connections
    Object.keys(peersRef.current).forEach((peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].destroy();
        delete peersRef.current[peerId];
      }
    });

    // Stop all local streams
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      screenStreamRef.current = null;
    }

    // Notify server that we're leaving the room
    if (roomRef.current) {
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
    setCallTime(0);
    setShowParticipants(false);

    // Redirect to dashboard
    navigate("/");
  };

  // Clean up on component unmount
  useEffect(() => {
    // Setup function to handle beforeunload event (when user closes tab/window)
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        socket.emit("leave-room", roomRef.current, userId);
      }
    };

    // Add beforeunload event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Return cleanup function executed on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Destroy all peer connections
      Object.keys(peersRef.current).forEach((peerId) => {
        if (peersRef.current[peerId]) {
          peersRef.current[peerId].destroy();
        }
      });

      // Stop media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Leave room if active
      if (roomRef.current) {
        socket.emit("leave-room", roomRef.current, userId);
      }

      // Clean up socket listeners
      cleanupSocketListeners();
    };
  }, [userId]);

  // Get call quality indicator colors
  const getCallQualityColor = () => {
    switch (callQuality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-yellow-500";
      case "fair":
        return "bg-orange-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <div className="relative h-[calc(100vh-4.5rem)] bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      {/* Status and Timer Bar */}
      {isCallActive && (
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 px-4 py-2 flex justify-between items-center z-10">
          <div className="py-1">
            <span className="text-sm">{status}</span>
          </div>
          <div className="py-1 flex items-center">
            <div
              className={`w-2 h-2 ${getCallQualityColor()} rounded-full mr-2`}
            ></div>
            <span className="text-sm font-medium">
              {formatCallTime(callTime)}
            </span>
          </div>
        </div>
      )}

      {isCallActive ? (
        <div className="relative flex flex-col h-full pt-10">
          {/* Main Video Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Remote Video Container */}
            {Object.entries(remotePeers).length > 0 ? (
              <div className="flex items-center justify-center w-full h-full px-4">
                {Object.entries(remotePeers).map(([peerId, { stream }]) => (
                  <div
                    key={peerId}
                    className="relative w-full h-full flex justify-center items-center"
                  >
                    {stream ? (
                      <div className="relative w-full max-w-4xl aspect-video">
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain bg-black rounded-lg"
                          ref={(element) => {
                            if (
                              element &&
                              stream &&
                              element.srcObject !== stream
                            ) {
                              element.srcObject = stream;
                            }
                          }}
                        />
                        {/* Remote User Name Banner */}
                        <div className="absolute top-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-lg">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 ${getCallQualityColor()} rounded-full mr-2`}
                            ></div>
                            <span className="text-sm">
                              {anotherPersonName || "Participant"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center bg-gray-800 bg-opacity-70 p-8 rounded-xl">
                          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center">
                            <FaUserCircle size={64} className="text-white" />
                          </div>
                          <div className="mt-4">
                            <h3 className="text-xl font-medium text-white">
                              {anotherPersonName || "Participant"}
                            </h3>
                            <p className="text-gray-300 mt-2">Connecting...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Waiting Screen when no remote peers
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-indigo-600 to-purple-700 rounded-full flex items-center justify-center">
                  <FaUserCircle size={64} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mt-4">
                  Waiting for {anotherPersonName || "participants"}
                </h3>
              </div>
            )}

            {/* Local Video - Fixed position based on screen sharing state */}
            {showLocalVideo && (
              <div
                className={`absolute ${
                  isScreenSharing
                    ? "bottom-24 right-4 w-32 h-24 z-20"
                    : "bottom-24 right-4 w-48 h-36 sm:w-56 sm:h-40 z-10"
                } rounded-lg overflow-hidden border-2 border-gray-800`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${
                    !isVideoOn ? "hidden" : ""
                  }`}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                    <FaUserCircle size={36} className="text-gray-400" />
                    <div className="text-xs mt-1">Camera Off</div>
                  </div>
                )}
                {/* Local User Name Banner */}
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                  {yourName || ""} (You)
                  {isMuted && (
                    <FaMicrophoneSlash className="inline ml-1" size={10} />
                  )}
                </div>
              </div>
            )}

            {/* Button to show local video when hidden */}
            {!showLocalVideo && (
              <button
                onClick={toggleLocalVideoDisplay}
                className="absolute bottom-24 right-4 bg-gray-800 p-2 rounded-full z-10"
                aria-label="Show local video"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Control Bar */}
          <div className="py-3 px-4 bg-black bg-opacity-80 flex justify-center">
            <div className="flex items-center justify-center space-x-4 md:space-x-6">
              {/* Primary Controls */}
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full ${
                  isMuted ? "bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isMuted ? (
                  <FaMicrophoneSlash size={20} />
                ) : (
                  <FaMicrophone size={20} />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  !isVideoOn
                    ? "bg-red-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
              </button>

              <button
                onClick={toggleScreenSharing}
                className={`p-3 rounded-full ${
                  isScreenSharing
                    ? "bg-green-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <FaShareSquare size={20} />
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 mx-2"
              >
                <FaPhoneSlash size={22} />
              </button>

              {/* Participants Button */}
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-3 rounded-full ${
                  showParticipants
                    ? "bg-purple-600"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <FaUsers size={20} />
              </button>
            </div>
          </div>

          {/* Participants Side Panel */}
          {showParticipants && (
            <div className="absolute top-0 right-0 bottom-0 w-72 bg-gray-900 bg-opacity-90 border-l border-gray-800 shadow-xl z-30 flex flex-col">
              {/* Panel Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-medium">Participants</h3>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="p-1 rounded-full hover:bg-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 flex items-center space-x-3">
                    <div className="bg-indigo-600 rounded-full p-2">
                      <FaUserCircle size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{yourName || ""} (You)</p>
                      <p className="text-xs text-gray-400">Host</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isMuted && (
                        <FaMicrophoneSlash
                          size={14}
                          className="text-gray-400"
                        />
                      )}
                      {!isVideoOn && (
                        <FaVideoSlash size={14} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {Object.keys(remotePeers).length > 0 ? (
                    Object.keys(remotePeers).map((peerId) => (
                      <div
                        key={peerId}
                        className="bg-gray-800 bg-opacity-50 rounded-xl p-3 flex items-center space-x-3"
                      >
                        <div className="bg-purple-600 rounded-full p-2">
                          <FaUserCircle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {anotherPersonName || "Participant"}
                          </p>
                          <p className="text-xs text-gray-400">Connected</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-800 bg-opacity-50 rounded-xl p-3 text-center">
                      <p className="text-gray-400 text-sm">
                        Waiting for others to join...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <FaVideo size={36} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mt-4 mb-1">Video Call</h2>
              <p className="text-gray-400">
                Video Session not Found Join From Dashboard
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium flex items-center justify-center space-x-2"
              >
                <FaSignOutAlt />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
