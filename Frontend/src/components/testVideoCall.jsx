import { useEffect, useRef, useState } from "react"
import SimplePeer from "simple-peer"
import socket from "../socket"
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
  FaClock,
  FaThumbtack,
  FaExpand,
  FaCompress,
} from "react-icons/fa"
import "../assets/VideoCall.css"
import { useLocation, useNavigate } from "react-router-dom"

const VideoCall = () => {
  const location = useLocation()
  const { roomId, yourName, anotherPersonName } = location.state || {}
  const roomIdFromUrl = roomId
  const token = localStorage.getItem("accessToken")
  const userId = token ? JSON.parse(atob(token.split(".")[1])).sub : null
  const navigate = useNavigate()

  // State for managing streams and connections
  const [localStream, setLocalStream] = useState(null)
  const [remotePeers, setRemotePeers] = useState({})
  const [isCallActive, setIsCallActive] = useState(false)
  const [status, setStatus] = useState("Enter Room ID to Join Call")
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [usersInRoom, setUsersInRoom] = useState([])
  const [copied, setCopied] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [callDuration, setCallDuration] = useState(0)
  const [callStartTime, setCallStartTime] = useState(null)

  // New state for pin video feature
  const [pinnedVideo, setPinnedVideo] = useState(null) // null, 'local', or peerId
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Refs for persistent values that don't cause re-renders
  const localVideoRef = useRef()
  const peersRef = useRef({})
  const screenStreamRef = useRef(null)
  const roomRef = useRef(roomIdFromUrl)
  const timerRef = useRef(null)
  const videoContainerRef = useRef(null)

  // Automatically join the room if roomId is provided in the URL
  useEffect(() => {
    if (roomId) {
      joinRoom(false)
    }
  }, [roomId])

  // Effect to handle call timer
  useEffect(() => {
    if (isCallActive && !callStartTime) {
      setCallStartTime(new Date())
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isCallActive, callStartTime])

  // Format the timer display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":")
  }

  // Effect to handle socket connection state
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true)
      if (roomRef.current && localStream) {
        socket.emit("join-room", roomRef.current, userId)
      }
    }

    const onDisconnect = () => {
      setIsConnected(false)
      setStatus("Connection lost. Trying to reconnect...")
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
    }
  }, [userId, localStream])

  /**
   * Toggle fullscreen mode for the video container
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  /**
   * Pin or unpin a video
   * @param {string} id - 'local' for local video or peerId for remote video
   */
  const togglePinVideo = (id) => {
    setPinnedVideo(pinnedVideo === id ? null : id)
  }

  /**
   * Copy room ID to clipboard for sharing
   */
  const copyRoomId = () => {
    const roomToCopy = roomRef.current || roomId
    navigator.clipboard.writeText(roomToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * Create or join a video call room
   */
  const joinRoom = (create = false) => {
    const roomToJoin = roomRef.current

    if (roomToJoin) {
      setIsCallActive(true)
      setStatus(`Preparing to join room: ${roomToJoin}`)
      initializeCall(roomToJoin)
    } else {
      alert("Please enter a valid room ID.")
    }
  }

  /**
   * Initialize media devices and socket connections for the call
   */
  const initializeCall = async (roomToJoin) => {
    try {
      // Request media with better constraints for quality
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      })

      // Set local stream
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setStatus(`Joining room: ${roomToJoin}`)

      // Clean up any existing listeners to avoid duplicates
      cleanupSocketListeners()

      // Setup socket event handlers for video calling
      setupSocketListeners(roomToJoin, stream)

      // Join the room
      socket.emit("join-room", roomToJoin, userId)
    } catch (error) {
      setStatus(`Error: ${error.message}. Please ensure camera and microphone permissions are granted.`)
      setIsCallActive(false)
    }
  }

  /**
   * Set up all socket event listeners for video calling
   */
  const setupSocketListeners = (roomToJoin, stream) => {
    // Add handler for when a room is full
    socket.on("room-full", (fullRoomId) => {
      setStatus("Room is full. Only 2 participants are allowed per call.")
      endCall()
    })

    // Listen for users already in the room
    socket.on("room-users", (users) => {
      setUsersInRoom(users)
      setStatus(`Call in progress`)

      // Create peers for each existing user
      users.forEach((remoteUserId) => {
        if (remoteUserId !== userId && !peersRef.current[remoteUserId]) {
          const peer = createPeer(remoteUserId, userId, stream, true, roomToJoin)
          peersRef.current[remoteUserId] = peer
          setRemotePeers((prev) => ({
            ...prev,
            [remoteUserId]: { peer, stream: null },
          }))
        }
      })
    })

    // Listen for new users connecting
    socket.on("user-connected", (remoteUserId) => {
      if (remoteUserId !== userId) {
        setStatus(`${anotherPersonName || "Another participant"} joined the call`)
        setUsersInRoom((prev) => [...prev, remoteUserId])
      }
    })

    // Handle incoming offers
    socket.on("receive-offer", ({ offer, fromUserId, roomId }) => {
      if (fromUserId !== userId) {
        if (peersRef.current[fromUserId]) {
          peersRef.current[fromUserId].signal(offer)
        } else {
          const peer = createPeer(fromUserId, userId, stream, false, roomId)
          peer.signal(offer)
          peersRef.current[fromUserId] = peer
          setRemotePeers((prev) => ({
            ...prev,
            [fromUserId]: { peer, stream: null },
          }))
        }
      }
    })

    // Handle incoming answers
    socket.on("receive-answer", ({ answer, fromUserId }) => {
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal(answer)
      }
    })

    // Handle ICE candidates
    socket.on("receive-ice-candidate", ({ candidate, fromUserId }) => {
      if (peersRef.current[fromUserId]) {
        peersRef.current[fromUserId].signal({ candidate })
      }
    })

    // Handle user disconnection
    socket.on("user-disconnected", (remoteUserId) => {
      setStatus(`${anotherPersonName || "Another participant"} left the call`)

      // If the pinned video is from the disconnected user, unpin it
      if (pinnedVideo === remoteUserId) {
        setPinnedVideo(null)
      }

      if (peersRef.current[remoteUserId]) {
        peersRef.current[remoteUserId].destroy()
        delete peersRef.current[remoteUserId]

        setRemotePeers((prev) => {
          const newPeers = { ...prev }
          delete newPeers[remoteUserId]
          return newPeers
        })

        setUsersInRoom((prev) => prev.filter((id) => id !== remoteUserId))
      }
    })
  }

  /**
   * Clean up socket listeners to prevent duplicates and memory leaks
   */
  const cleanupSocketListeners = () => {
    socket.off("room-full")
    socket.off("room-users")
    socket.off("user-connected")
    socket.off("receive-offer")
    socket.off("receive-answer")
    socket.off("receive-ice-candidate")
    socket.off("user-disconnected")
  }

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
    })

    // Handle signaling events (offer/answer exchange)
    peer.on("signal", (data) => {
      socket.emit(initiator ? "send-offer" : "send-answer", {
        [initiator ? "offer" : "answer"]: data,
        toUserId: remoteUserId,
        fromUserId: myUserId,
        roomId,
      })
    })

    // Handle incoming media stream from remote peer
    peer.on("stream", (remoteStream) => {
      setRemotePeers((prev) => ({
        ...prev,
        [remoteUserId]: { ...prev[remoteUserId], stream: remoteStream },
      }))
    })

    // Handle peer connection errors
    peer.on("error", (err) => {
      setStatus(`Connection error: ${err.message}`)
    })

    return peer
  }

  /**
   * Toggle microphone mute status
   */
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      if (audioTracks.length > 0) {
        const enabled = !audioTracks[0].enabled
        audioTracks[0].enabled = enabled
        setIsMuted(!enabled)
      }
    }
  }

  /**
   * Toggle camera on/off status
   */
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      if (videoTracks.length > 0) {
        const enabled = !videoTracks[0].enabled
        videoTracks[0].enabled = enabled
        setIsVideoOn(enabled)
      }
    }
  }

  /**
   * Toggle screen sharing on/off
   */
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        screenStreamRef.current = null
      }

      // Restore camera video for all peers
      Object.keys(peersRef.current).forEach((peerId) => {
        const peer = peersRef.current[peerId]

        if (localStream && peer && peer.streams && peer.streams.length > 0) {
          const videoTrack = localStream.getVideoTracks()[0]
          if (videoTrack && peer.streams[0].getVideoTracks().length > 0) {
            peer.replaceTrack(peer.streams[0].getVideoTracks()[0], videoTrack, peer.streams[0])
          }
        }
      })

      setIsScreenSharing(false)
      setStatus("Screen sharing stopped")
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        screenStreamRef.current = screenStream

        // Replace camera video with screen sharing for all peers
        Object.keys(peersRef.current).forEach((peerId) => {
          const peer = peersRef.current[peerId]

          if (peer && peer.streams && peer.streams.length > 0) {
            const screenTrack = screenStream.getVideoTracks()[0]
            if (screenTrack && peer.streams[0].getVideoTracks().length > 0) {
              peer.replaceTrack(peer.streams[0].getVideoTracks()[0], screenTrack, peer.streams[0])
            }
          }
        })

        // Handle when user stops sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing()
        }

        setIsScreenSharing(true)
        setStatus("Screen sharing started")
      } catch (error) {
        setStatus(`Screen sharing error: ${error.message}`)
      }
    }
  }

  /**
   * End the current call and clean up resources
   */
  const endCall = () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Reset timer state
    setCallDuration(0)
    setCallStartTime(null)

    // Clean up all peer connections
    Object.keys(peersRef.current).forEach((peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].destroy()
        delete peersRef.current[peerId]
      }
    })

    // Stop all local streams
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop()
      })
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      screenStreamRef.current = null
    }

    // Notify server that we're leaving the room
    if (roomRef.current) {
      socket.emit("leave-room", roomRef.current, userId)
      roomRef.current = ""
    }

    // Clean up socket listeners
    cleanupSocketListeners()

    // Reset state
    setIsCallActive(false)
    setLocalStream(null)
    setRemotePeers({})
    setStatus("Call Ended")
    setIsScreenSharing(false)
    setUsersInRoom([])
    setPinnedVideo(null)

    // Redirect to dashboard
    navigate("/")
  }

  /**
   * Attempt to reconnect socket if connection is lost
   */
  const reconnect = () => {
    if (!isConnected) {
      socket.connect()
      setStatus("Reconnecting...")
    }
  }

  // Clean up on component unmount
  useEffect(() => {
    // Setup function to handle beforeunload event (when user closes tab/window)
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        socket.emit("leave-room", roomRef.current, userId)
      }
    }

    // Add beforeunload event listener
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Return cleanup function executed on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)

      // Destroy all peer connections
      Object.keys(peersRef.current).forEach((peerId) => {
        if (peersRef.current[peerId]) {
          peersRef.current[peerId].destroy()
        }
      })

      // Stop media tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop()
        })
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }

      // Leave room if active
      if (roomRef.current) {
        socket.emit("leave-room", roomRef.current, userId)
      }

      // Remove all socket listeners
      cleanupSocketListeners()
    }
  }, [userId])

  // Render the video grid based on pinned state
  const renderVideoGrid = () => {
    // If we have a pinned video, show it prominently
    if (pinnedVideo) {
      return (
        <div className="grid grid-cols-1 gap-6 w-full max-w-6xl mx-auto h-full">
          {/* Pinned video takes most of the space */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500 h-full">
            {pinnedVideo === "local" ? (
              // Local video is pinned
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!isVideoOn ? "opacity-0" : ""}`}
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                  {isMuted && <FaMicrophoneSlash className="text-red-400" />}
                  {!isVideoOn && <FaVideoSlash className="text-red-400" />}
                  <span>{yourName || "You"}</span>
                </div>
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl font-medium shadow-lg">
                      {yourName ? yourName.charAt(0).toUpperCase() : userId ? userId.charAt(0).toUpperCase() : "Y"}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Remote video is pinned
              <>
                {remotePeers[pinnedVideo]?.stream ? (
                  <video
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(element) => {
                      if (
                        element &&
                        remotePeers[pinnedVideo]?.stream &&
                        element.srcObject !== remotePeers[pinnedVideo].stream
                      ) {
                        element.srcObject = remotePeers[pinnedVideo].stream
                      }
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center text-white">
                      <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <div className="text-lg font-medium">Connecting...</div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                  {anotherPersonName || pinnedVideo}
                </div>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => togglePinVideo(pinnedVideo)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all duration-200"
                title="Unpin Video"
              >
                <FaThumbtack />
              </button>
            </div>
          </div>

          {/* Small thumbnails for other videos */}
          <div className="absolute bottom-24 right-6 flex gap-2 z-10">
            {/* Local video thumbnail (if not pinned) */}
            {pinnedVideo !== "local" && (
              <div className="relative w-40 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${!isVideoOn ? "opacity-0" : ""}`}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-medium">
                      {yourName ? yourName.charAt(0).toUpperCase() : "Y"}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => togglePinVideo("local")}
                  className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white p-1 rounded-md hover:bg-blue-600 transition-all duration-200"
                  title="Pin Your Video"
                >
                  <FaThumbtack className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Remote video thumbnails (if not pinned) */}
            {Object.entries(remotePeers).map(
              ([peerId, { stream }]) =>
                peerId !== pinnedVideo && (
                  <div
                    key={`thumb-${peerId}`}
                    className="relative w-40 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700"
                  >
                    {stream ? (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(element) => {
                          if (element && stream && element.srcObject !== stream) {
                            element.srcObject = stream
                          }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <button
                      onClick={() => togglePinVideo(peerId)}
                      className="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white p-1 rounded-md hover:bg-blue-600 transition-all duration-200"
                      title="Pin This Video"
                    >
                      <FaThumbtack className="w-3 h-3" />
                    </button>
                  </div>
                ),
            )}
          </div>
        </div>
      )
    }

    // Default grid layout when no video is pinned
    return (
      <div
        className={`grid gap-6 w-full max-w-6xl mx-auto ${
          Object.keys(remotePeers).length > 0 ? "grid-cols-2" : "grid-cols-1"
        }`}
        style={{
          aspectRatio: Object.keys(remotePeers).length > 0 ? "auto" : "16/9",
        }}
      >
        {/* Local video */}
        <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 h-full">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isVideoOn ? "opacity-0" : ""}`}
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
            {isMuted && <FaMicrophoneSlash className="text-red-400" />}
            {!isVideoOn && <FaVideoSlash className="text-red-400" />}
            <span>{yourName || "You"}</span>
          </div>
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl font-medium shadow-lg">
                {yourName ? yourName.charAt(0).toUpperCase() : userId ? userId.charAt(0).toUpperCase() : "Y"}
              </div>
            </div>
          )}
          {!isConnected && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-xl font-medium animate-pulse">Reconnecting...</div>
              </div>
            </div>
          )}
          {isScreenSharing && (
            <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
              Screen Sharing
            </div>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => togglePinVideo("local")}
              className="bg-gray-800 bg-opacity-70 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200"
              title="Pin Your Video"
            >
              <FaThumbtack />
            </button>
          </div>
        </div>

        {/* Remote videos */}
        {Object.entries(remotePeers).map(([peerId, { stream }]) => (
          <div
            className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 h-full"
            key={peerId}
          >
            {stream ? (
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(element) => {
                  if (element && stream && element.srcObject !== stream) {
                    element.srcObject = stream
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white">
                  <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <div className="text-lg font-medium">Connecting...</div>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
              {anotherPersonName || peerId}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => togglePinVideo(peerId)}
                className="bg-gray-800 bg-opacity-70 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200"
                title="Pin This Video"
              >
                <FaThumbtack />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render the correct view based on call state
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {isCallActive ? (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 relative">
          {/* Status Bar */}
          <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-3 shadow-md z-10">
            <div className="flex items-center gap-3">
              <span className="font-medium text-lg">Room: {roomRef.current}</span>
              <button
                onClick={copyRoomId}
                className="bg-blue-800 hover:bg-blue-900 text-white cursor-pointer flex items-center justify-center text-sm p-1.5 rounded-md transition-all duration-200 ease-in-out"
                title="Copy Room ID"
              >
                {copied ? <FaCheck className="mr-1" /> : <FaCopy className="mr-1" />}
                {copied ? "Copied" : "Copy ID"}
              </button>
              {!isConnected && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-xs ml-2 animate-pulse">
                  Disconnected
                </span>
              )}
            </div>
            <div className="font-medium flex items-center gap-3">
              <span className="bg-blue-800 px-3 py-1 rounded-md">{status}</span>
              {callDuration > 0 && (
                <div className="flex items-center gap-2 bg-blue-800 px-3 py-1 rounded-md">
                  <FaClock className="text-sm" />
                  <span className="font-mono">{formatTime(callDuration)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out flex items-center gap-2"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ease-in-out ${
                    showParticipants ? "bg-blue-800" : "bg-blue-700 hover:bg-blue-800"
                  }`}
                  title="Toggle Participants"
                >
                  <FaUsers />
                  <span>Participants</span>
                  <span className="bg-white text-blue-700 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {usersInRoom.length + 1}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          {showParticipants && (
            <div className="absolute top-16 right-0 bg-white rounded-bl-lg shadow-xl w-72 z-10 overflow-hidden animate-slideDown border-l border-b border-gray-200">
              <h3 className="bg-gradient-to-r from-blue-700 to-blue-600 text-white m-0 p-4 text-base font-medium">
                Participants ({usersInRoom.length + 1})
              </h3>
              <ul className="list-none p-0 m-0 max-h-96 overflow-y-auto">
                <li className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      {yourName ? yourName.charAt(0).toUpperCase() : "Y"}
                    </div>
                    <span className="font-medium">{yourName || userId} (You)</span>
                  </div>
                  {!isConnected && <span className="text-red-500 text-xs font-medium">Disconnected</span>}
                </li>
                {usersInRoom.map((user) => (
                  <li key={user} className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                      {anotherPersonName ? anotherPersonName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span>{anotherPersonName || user}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Grid */}
          <div className="flex-grow p-6 flex items-center justify-center" ref={videoContainerRef}>
            {renderVideoGrid()}
          </div>

          {/* Call Controls */}
          <div className="flex justify-center items-center gap-5 py-5 bg-gray-800 px-6 border-t border-gray-700">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transform transition-all duration-200 hover:scale-105 ${
                isMuted ? "bg-red-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>

            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transform transition-all duration-200 hover:scale-105 ${
                !isVideoOn ? "bg-red-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              title={isVideoOn ? "Turn Off Video" : "Turn On Video"}
            >
              {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
            </button>

            <button
              onClick={toggleScreenSharing}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transform transition-all duration-200 hover:scale-105 ${
                isScreenSharing
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
              disabled={!isConnected}
            >
              {isScreenSharing ? <FaDesktop /> : <FaShareSquare />}
            </button>

            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-red-600 text-white hover:bg-red-700 shadow-lg transform transition-all duration-200 hover:scale-105"
              title="End Call"
            >
              <FaPhoneSlash />
            </button>
          </div>

          {/* Reconnect Overlay */}
          {!isConnected && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-500 animate-ping"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Connection Lost</h3>
                <p className="text-gray-600 mb-6">
                  We're trying to reconnect you automatically. Please wait a moment...
                </p>
                <button
                  onClick={reconnect}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-md"
                >
                  Reconnect Now
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-full bg-gradient-to-br from-blue-700 to-indigo-900">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-11/12 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <FaVideo className="text-blue-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">No Active Session Found</h2>
            <p className="text-gray-600 mb-6 text-center">
              It seems you don't have an active video call session. Please return to the dashboard to start or join a
              call.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 w-full font-medium text-lg shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoCall

