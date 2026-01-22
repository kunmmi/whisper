# Calling Feature Implementation Plan

This document provides a detailed step-by-step plan to implement audio and video calling functionality in the chat application.

---

## Overview

**Goal:** Enable users to make audio and video calls to each other in real-time using WebRTC.

**Technology Stack:**
- **WebRTC** (browser-native, no packages needed)
- **Socket.IO** (already installed - for signaling)
- **STUN/TURN servers** (free services for NAT traversal)

---

## Phase 1 — Backend Signaling Infrastructure

### Task 1.1: Add Call State Management
- [ ] Create call state storage in `socket.js`:
  - [ ] `activeCalls` Map: `callId -> { callerId, calleeId, chatId, type, status }`
  - [ ] `userCalls` Map: `userId -> callId` (track user's active call)
  - [ ] Helper functions:
    - [ ] `createCall(callerId, calleeId, chatId, type)` - Create new call
    - [ ] `getCall(callId)` - Get call by ID
    - [ ] `endCall(callId)` - End and cleanup call
    - [ ] `getUserActiveCall(userId)` - Get user's active call
- [ ] Test call state management

### Task 1.2: Implement Call Initiation Handler
- [ ] Add `call:initiate` event handler in `socket.js`:
  - [ ] Validate chat exists
  - [ ] Validate caller and callee are in same chat
  - [ ] Validate callee is online
  - [ ] Validate caller doesn't have active call
  - [ ] Validate callee doesn't have active call
  - [ ] Create call record
  - [ ] Generate unique call ID
  - [ ] Send `incoming_call` event to callee
  - [ ] Send `call:initiated` confirmation to caller
- [ ] Handle errors (user offline, already in call, etc.)
- [ ] Test call initiation

### Task 1.3: Implement Call Acceptance Handler
- [ ] Add `call:accept` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is the callee
  - [ ] Validate call status is 'ringing'
  - [ ] Update call status to 'active'
  - [ ] Send `call:accepted` to caller
  - [ ] Send `call:accepted` to callee
- [ ] Test call acceptance

### Task 1.4: Implement Call Rejection Handler
- [ ] Add `call:reject` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is the callee
  - [ ] Update call status to 'rejected'
  - [ ] Send `call:rejected` to caller
  - [ ] Clean up call state
- [ ] Test call rejection

### Task 1.5: Implement Call End Handler
- [ ] Add `call:end` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is participant
  - [ ] Update call status to 'ended'
  - [ ] Send `call:ended` to both participants
  - [ ] Clean up call state
- [ ] Handle cleanup on disconnect
- [ ] Test call ending

### Task 1.6: Implement WebRTC Signaling Handlers
- [ ] Add `call:offer` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is participant
  - [ ] Forward offer to other participant
- [ ] Add `call:answer` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is participant
  - [ ] Forward answer to other participant
- [ ] Add `call:ice-candidate` event handler:
  - [ ] Validate call exists
  - [ ] Validate user is participant
  - [ ] Forward ICE candidate to other participant
- [ ] Test WebRTC signaling

### Task 1.7: Add Call Timeout Handling
- [ ] Implement call timeout (30 seconds):
  - [ ] Start timeout when call is initiated
  - [ ] Cancel timeout when call is accepted
  - [ ] Auto-reject if timeout expires
  - [ ] Send timeout notification to caller
- [ ] Test call timeout

### Task 1.8: Update Socket Disconnect Handler
- [ ] Update disconnect handler to:
  - [ ] End any active calls when user disconnects
  - [ ] Notify other participant
  - [ ] Clean up call state
- [ ] Test disconnect during call

**Deliverable:** Complete backend signaling infrastructure for calls

---

## Phase 2 — Frontend WebRTC Hook

### Task 2.1: Create useWebRTC Hook Structure
- [ ] Create `frontend/src/hooks/useWebRTC.js`
- [ ] Set up basic hook structure:
  - [ ] State management (localStream, remoteStream, peerConnection, callState)
  - [ ] Refs for video/audio elements
  - [ ] Cleanup on unmount
- [ ] Test hook structure

### Task 2.2: Implement STUN/TURN Configuration
- [ ] Add STUN server configuration:
  - [ ] Use Google's free STUN servers
  - [ ] Add TURN server configuration (optional, for production)
- [ ] Create RTCPeerConnection configuration object
- [ ] Test configuration

### Task 2.3: Implement Media Stream Acquisition
- [ ] Add `getLocalStream(type)` function:
  - [ ] Request audio stream (for audio calls)
  - [ ] Request audio + video stream (for video calls)
  - [ ] Handle permission denial
  - [ ] Return MediaStream
- [ ] Add `stopLocalStream()` function:
  - [ ] Stop all tracks
  - [ ] Clean up stream
- [ ] Test media stream acquisition

### Task 2.4: Implement Peer Connection Setup
- [ ] Add `createPeerConnection()` function:
  - [ ] Create RTCPeerConnection with STUN config
  - [ ] Set up event handlers:
    - [ ] `onicecandidate` - Send ICE candidates
    - [ ] `ontrack` - Handle remote stream
    - [ ] `onconnectionstatechange` - Handle connection state
  - [ ] Add local stream tracks to peer connection
- [ ] Test peer connection creation

### Task 2.5: Implement Offer Creation (Caller)
- [ ] Add `createOffer()` function:
  - [ ] Create offer using `peerConnection.createOffer()`
  - [ ] Set local description
  - [ ] Return offer SDP
- [ ] Test offer creation

### Task 2.6: Implement Answer Creation (Callee)
- [ ] Add `createAnswer(offer)` function:
  - [ ] Set remote description (offer)
  - [ ] Create answer using `peerConnection.createAnswer()`
  - [ ] Set local description
  - [ ] Return answer SDP
- [ ] Test answer creation

### Task 2.7: Implement ICE Candidate Handling
- [ ] Add `handleIceCandidate(candidate)` function:
  - [ ] Add ICE candidate to peer connection
- [ ] Add `sendIceCandidate(candidate)` function:
  - [ ] Emit candidate via Socket.IO
- [ ] Test ICE candidate exchange

### Task 2.8: Implement Call Flow Functions
- [ ] Add `startCall(calleeId, chatId, type)` function:
  - [ ] Get local stream
  - [ ] Create peer connection
  - [ ] Create offer
  - [ ] Emit `call:initiate` via Socket.IO
  - [ ] Emit `call:offer` with SDP
- [ ] Add `acceptCall(callId, offer)` function:
  - [ ] Get local stream
  - [ ] Create peer connection
  - [ ] Set remote description (offer)
  - [ ] Create answer
  - [ ] Emit `call:accept` via Socket.IO
  - [ ] Emit `call:answer` with SDP
- [ ] Add `rejectCall(callId)` function:
  - [ ] Emit `call:reject` via Socket.IO
  - [ ] Clean up local stream
- [ ] Add `endCall(callId)` function:
  - [ ] Close peer connection
  - [ ] Stop local stream
  - [ ] Emit `call:end` via Socket.IO
  - [ ] Clean up state
- [ ] Test call flow functions

### Task 2.9: Implement Media Controls
- [ ] Add `toggleMute()` function:
  - [ ] Toggle audio track enabled state
  - [ ] Update mute state
- [ ] Add `toggleVideo()` function:
  - [ ] Toggle video track enabled state
  - [ ] Update video state
- [ ] Add `switchCamera()` function (for video calls):
  - [ ] Get available video devices
  - [ ] Switch to different camera
- [ ] Test media controls

**Deliverable:** Complete WebRTC hook with all functionality

---

## Phase 3 — Call UI Components

### Task 3.1: Create CallModal Component Structure
- [ ] Create `frontend/src/components/CallModal.jsx`
- [ ] Set up basic structure:
  - [ ] Modal overlay
  - [ ] Call info display (caller/callee name, call type)
  - [ ] Video display areas (local and remote)
  - [ ] Call controls (answer, reject, mute, video, end)
  - [ ] Call duration timer
- [ ] Add styling with Tailwind CSS
- [ ] Test component structure

### Task 3.2: Implement Incoming Call UI
- [ ] Display incoming call screen:
  - [ ] Show caller information (name, avatar)
  - [ ] Show call type (audio/video)
  - [ ] Display "Answer" button
  - [ ] Display "Reject" button
  - [ ] Show ringing animation
- [ ] Handle answer button click
- [ ] Handle reject button click
- [ ] Test incoming call UI

### Task 3.3: Implement Active Call UI
- [ ] Display active call screen:
  - [ ] Show remote video/audio (if video call)
  - [ ] Show local video preview (if video call)
  - [ ] Show call duration timer
  - [ ] Display call controls:
    - [ ] Mute/unmute button
    - [ ] Video on/off button (video calls only)
    - [ ] End call button
- [ ] Update UI based on call state
- [ ] Test active call UI

### Task 3.4: Implement Call Controls
- [ ] Add mute/unmute button:
  - [ ] Toggle icon (mic on/off)
  - [ ] Call `toggleMute()` from hook
  - [ ] Update button state
- [ ] Add video toggle button (video calls):
  - [ ] Toggle icon (camera on/off)
  - [ ] Call `toggleVideo()` from hook
  - [ ] Update button state
- [ ] Add end call button:
  - [ ] Call `endCall()` from hook
  - [ ] Close modal
- [ ] Test call controls

### Task 3.5: Implement Video Display
- [ ] Add remote video element:
  - [ ] Display remote stream
  - [ ] Handle stream changes
  - [ ] Show placeholder when no video
- [ ] Add local video preview:
  - [ ] Display local stream
  - [ ] Smaller preview (picture-in-picture style)
  - [ ] Position in corner
- [ ] Handle video element refs
- [ ] Test video display

### Task 3.6: Implement Call Timer
- [ ] Add call duration timer:
  - [ ] Start timer when call is accepted
  - [ ] Format time (MM:SS)
  - [ ] Update every second
  - [ ] Stop when call ends
- [ ] Display timer in call UI
- [ ] Test call timer

### Task 3.7: Add Call States and Transitions
- [ ] Handle different call states:
  - [ ] `idle` - No call
  - [ ] `ringing` - Incoming call
  - [ ] `calling` - Outgoing call
  - [ ] `active` - Call in progress
  - [ ] `ended` - Call ended
- [ ] Update UI based on state
- [ ] Handle state transitions
- [ ] Test state management

**Deliverable:** Complete call UI component

---

## Phase 4 — Socket.IO Integration

### Task 4.1: Add Call Event Listeners
- [ ] Update `frontend/src/services/socket.js` or create call service:
  - [ ] Listen for `incoming_call` event
  - [ ] Listen for `call:accepted` event
  - [ ] Listen for `call:rejected` event
  - [ ] Listen for `call:ended` event
  - [ ] Listen for `call:offer` event
  - [ ] Listen for `call:answer` event
  - [ ] Listen for `call:ice-candidate` event
- [ ] Create event handler functions
- [ ] Test event listeners

### Task 4.2: Integrate WebRTC Hook with Socket.IO
- [ ] Connect WebRTC hook to Socket.IO:
  - [ ] Emit `call:initiate` when starting call
  - [ ] Emit `call:accept` when accepting call
  - [ ] Emit `call:reject` when rejecting call
  - [ ] Emit `call:end` when ending call
  - [ ] Emit `call:offer` with SDP
  - [ ] Emit `call:answer` with SDP
  - [ ] Emit `call:ice-candidate` with candidate
- [ ] Handle incoming Socket.IO events in hook
- [ ] Test Socket.IO integration

### Task 4.3: Create Call Context/State Management
- [ ] Create `frontend/src/contexts/CallContext.jsx`:
  - [ ] Global call state
  - [ ] Active call information
  - [ ] Call functions (start, accept, reject, end)
  - [ ] Call state setters
- [ ] Create CallProvider component
- [ ] Wrap app with CallProvider
- [ ] Test call context

**Deliverable:** Complete Socket.IO integration for calls

---

## Phase 5 — UI Integration

### Task 5.1: Add Call Buttons to Chat Interface
- [ ] Update `Chats.jsx`:
  - [ ] Add audio call button (phone icon)
  - [ ] Add video call button (video icon)
  - [ ] Position buttons in chat header
  - [ ] Handle button clicks
  - [ ] Disable buttons if user is in a call
- [ ] Update `ChatWindow.jsx`:
  - [ ] Add audio call button
  - [ ] Add video call button
  - [ ] Position buttons in chat header
  - [ ] Handle button clicks
- [ ] Test call buttons

### Task 5.2: Integrate CallModal with Chat Components
- [ ] Import CallModal in `Chats.jsx`
- [ ] Import CallModal in `ChatWindow.jsx`
- [ ] Show CallModal when call is active
- [ ] Pass call state and handlers to CallModal
- [ ] Handle modal visibility
- [ ] Test modal integration

### Task 5.3: Add Call Notifications
- [ ] Create notification system:
  - [ ] Show notification for incoming calls
  - [ ] Play ringtone (optional)
  - [ ] Browser notification (if allowed)
- [ ] Handle notification clicks
- [ ] Test notifications

### Task 5.4: Add Call History (Optional)
- [ ] Create call history display:
  - [ ] Show missed calls
  - [ ] Show call duration
  - [ ] Show call type (audio/video)
- [ ] Store call history in state or database
- [ ] Display in chat or separate section
- [ ] Test call history

**Deliverable:** Complete UI integration

---

## Phase 6 — Error Handling & Edge Cases

### Task 6.1: Handle Permission Denials
- [ ] Handle microphone permission denial:
  - [ ] Show error message
  - [ ] Provide instructions
  - [ ] Allow retry
- [ ] Handle camera permission denial (video calls):
  - [ ] Show error message
  - [ ] Fallback to audio call option
  - [ ] Provide instructions
- [ ] Test permission handling

### Task 6.2: Handle Network Issues
- [ ] Handle connection failures:
  - [ ] Show error message
  - [ ] Allow retry
  - [ ] Clean up on failure
- [ ] Handle ICE connection failures:
  - [ ] Show error message
  - [ ] Attempt reconnection
  - [ ] Fallback options
- [ ] Test network error handling

### Task 6.3: Handle User Offline
- [ ] Check if user is online before calling
- [ ] Show error if user is offline
- [ ] Prevent call initiation
- [ ] Test offline handling

### Task 6.4: Handle Multiple Calls
- [ ] Prevent multiple simultaneous calls:
  - [ ] Check if user has active call
  - [ ] Show error if trying to start new call
  - [ ] Option to end current call first
- [ ] Test multiple call prevention

### Task 6.5: Handle Call Timeout
- [ ] Display timeout message to caller
- [ ] Auto-cleanup on timeout
- [ ] Update UI on timeout
- [ ] Test timeout handling

**Deliverable:** Robust error handling

---

## Phase 7 — Testing & Polish

### Task 7.1: Browser Compatibility Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Document browser-specific issues
- [ ] Add polyfills if needed

### Task 7.2: Network Scenario Testing
- [ ] Test on same network
- [ ] Test on different networks
- [ ] Test with NAT (home networks)
- [ ] Test with firewall restrictions
- [ ] Test with poor connection
- [ ] Document network requirements

### Task 7.3: Call Quality Testing
- [ ] Test audio quality
- [ ] Test video quality
- [ ] Test with different resolutions
- [ ] Test with bandwidth limitations
- [ ] Test call stability
- [ ] Document quality settings

### Task 7.4: UI/UX Polish
- [ ] Add loading states
- [ ] Add smooth transitions
- [ ] Add animations
- [ ] Improve mobile responsiveness
- [ ] Add accessibility features
- [ ] Test user experience

### Task 7.5: Performance Optimization
- [ ] Optimize video resolution
- [ ] Add bandwidth adaptation
- [ ] Optimize re-renders
- [ ] Clean up resources properly
- [ ] Test performance

**Deliverable:** Fully tested and polished calling feature

---

## Technical Specifications

### STUN/TURN Configuration

**Free STUN Servers:**
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
}
```

**TURN Servers (for production):**
- Use services like Twilio, Vonage, or self-hosted coturn
- Required for users behind strict NATs/firewalls

### Socket.IO Events

**Client → Server:**
- `call:initiate` - Start a call
- `call:accept` - Accept incoming call
- `call:reject` - Reject incoming call
- `call:end` - End active call
- `call:offer` - Send WebRTC offer
- `call:answer` - Send WebRTC answer
- `call:ice-candidate` - Send ICE candidate

**Server → Client:**
- `incoming_call` - Receive incoming call notification
- `call:initiated` - Call initiation confirmed
- `call:accepted` - Call accepted
- `call:rejected` - Call rejected
- `call:ended` - Call ended
- `call:offer` - Receive WebRTC offer
- `call:answer` - Receive WebRTC answer
- `call:ice-candidate` - Receive ICE candidate
- `call:timeout` - Call timeout notification

### File Structure

```
frontend/src/
├── hooks/
│   └── useWebRTC.js          (NEW)
├── components/
│   └── CallModal.jsx         (NEW)
├── contexts/
│   └── CallContext.jsx       (NEW)
└── services/
    └── socket.js             (UPDATE - add call events)

backend/src/
├── config/
│   └── socket.js             (UPDATE - add call handlers)
```

---

## Implementation Order

1. **Phase 1** - Backend signaling (foundation)
2. **Phase 2** - WebRTC hook (core functionality)
3. **Phase 3** - Call UI (user interface)
4. **Phase 4** - Socket.IO integration (connect frontend/backend)
5. **Phase 5** - UI integration (add buttons, integrate modal)
6. **Phase 6** - Error handling (robustness)
7. **Phase 7** - Testing & polish (quality)

---

## Estimated Timeline

- **Phase 1:** 2-3 hours
- **Phase 2:** 4-5 hours
- **Phase 3:** 3-4 hours
- **Phase 4:** 2-3 hours
- **Phase 5:** 2-3 hours
- **Phase 6:** 2-3 hours
- **Phase 7:** 3-4 hours

**Total:** ~18-25 hours

---

## Notes

- Start with **audio calls only** for simplicity
- Add **video calls** after audio works
- Use **free STUN servers** for MVP
- Consider **TURN servers** for production
- Test on **multiple browsers** early
- Handle **permissions** gracefully
- Clean up **resources** properly on unmount

---

## Success Criteria

- [ ] Users can initiate audio calls
- [ ] Users can receive and answer calls
- [ ] Users can reject calls
- [ ] Users can end calls
- [ ] Audio quality is acceptable
- [ ] Calls work across different networks
- [ ] Error handling works properly
- [ ] UI is intuitive and responsive
- [ ] No memory leaks
- [ ] Works on major browsers

---

## Future Enhancements

- Group calls (3+ participants)
- Screen sharing
- Call recording
- Call history in database
- Push notifications for missed calls
- Call quality indicators
- Bandwidth adaptation
- Custom ringtones
- Do Not Disturb mode

