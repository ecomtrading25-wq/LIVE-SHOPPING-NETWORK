/**
 * WebRTC Signaling Server
 * Handles peer connection establishment, ICE candidate exchange, and session management
 */

import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'error';
  showId?: string;
  userId?: string;
  peerId?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  role?: 'host' | 'viewer';
  error?: string;
}

interface Peer {
  id: string;
  userId: string;
  showId: string;
  role: 'host' | 'viewer';
  ws: WebSocket;
  connectedAt: Date;
}

interface Room {
  showId: string;
  host?: Peer;
  viewers: Map<string, Peer>;
  createdAt: Date;
}

class WebRTCSignalingServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private peers: Map<string, Peer> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    console.log(`[WebRTC Signaling] Server started on port ${port}`);
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const peerId = this.generatePeerId();
      console.log(`[WebRTC Signaling] New connection: ${peerId}`);

      ws.on('message', (data: string) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleMessage(peerId, ws, message);
        } catch (error) {
          console.error('[WebRTC Signaling] Invalid message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(peerId);
      });

      ws.on('error', (error) => {
        console.error(`[WebRTC Signaling] WebSocket error for ${peerId}:`, error);
      });
    });
  }

  private handleMessage(peerId: string, ws: WebSocket, message: SignalingMessage) {
    switch (message.type) {
      case 'join':
        this.handleJoin(peerId, ws, message);
        break;
      case 'offer':
        this.handleOffer(peerId, message);
        break;
      case 'answer':
        this.handleAnswer(peerId, message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(peerId, message);
        break;
      case 'leave':
        this.handleLeave(peerId);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleJoin(peerId: string, ws: WebSocket, message: SignalingMessage) {
    if (!message.showId || !message.userId || !message.role) {
      this.sendError(ws, 'Missing required fields: showId, userId, role');
      return;
    }

    const peer: Peer = {
      id: peerId,
      userId: message.userId,
      showId: message.showId,
      role: message.role,
      ws,
      connectedAt: new Date(),
    };

    this.peers.set(peerId, peer);

    // Get or create room
    let room = this.rooms.get(message.showId);
    if (!room) {
      room = {
        showId: message.showId,
        viewers: new Map(),
        createdAt: new Date(),
      };
      this.rooms.set(message.showId, room);
    }

    if (message.role === 'host') {
      if (room.host) {
        this.sendError(ws, 'Room already has a host');
        return;
      }
      room.host = peer;
      console.log(`[WebRTC Signaling] Host joined room ${message.showId}`);
    } else {
      room.viewers.set(peerId, peer);
      console.log(`[WebRTC Signaling] Viewer joined room ${message.showId} (${room.viewers.size} viewers)`);
      
      // Notify host of new viewer
      if (room.host) {
        this.send(room.host.ws, {
          type: 'join',
          peerId,
          userId: message.userId,
          role: 'viewer',
        });
      }
    }

    // Send success response
    this.send(ws, {
      type: 'join',
      peerId,
      showId: message.showId,
    });
  }

  private handleOffer(peerId: string, message: SignalingMessage) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.error(`[WebRTC Signaling] Peer not found: ${peerId}`);
      return;
    }

    const room = this.rooms.get(peer.showId);
    if (!room) {
      console.error(`[WebRTC Signaling] Room not found: ${peer.showId}`);
      return;
    }

    // Forward offer to target peer
    const targetPeer = message.peerId ? this.peers.get(message.peerId) : null;
    if (targetPeer) {
      this.send(targetPeer.ws, {
        type: 'offer',
        peerId: peer.id,
        sdp: message.sdp,
      });
    }
  }

  private handleAnswer(peerId: string, message: SignalingMessage) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.error(`[WebRTC Signaling] Peer not found: ${peerId}`);
      return;
    }

    // Forward answer to target peer
    const targetPeer = message.peerId ? this.peers.get(message.peerId) : null;
    if (targetPeer) {
      this.send(targetPeer.ws, {
        type: 'answer',
        peerId: peer.id,
        sdp: message.sdp,
      });
    }
  }

  private handleIceCandidate(peerId: string, message: SignalingMessage) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.error(`[WebRTC Signaling] Peer not found: ${peerId}`);
      return;
    }

    // Forward ICE candidate to target peer
    const targetPeer = message.peerId ? this.peers.get(message.peerId) : null;
    if (targetPeer) {
      this.send(targetPeer.ws, {
        type: 'ice-candidate',
        peerId: peer.id,
        candidate: message.candidate,
      });
    }
  }

  private handleLeave(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    const room = this.rooms.get(peer.showId);
    if (!room) return;

    if (peer.role === 'host') {
      // Host left - notify all viewers and close room
      room.viewers.forEach((viewer) => {
        this.send(viewer.ws, {
          type: 'leave',
          peerId: peer.id,
          role: 'host',
        });
      });
      this.rooms.delete(peer.showId);
      console.log(`[WebRTC Signaling] Host left, room ${peer.showId} closed`);
    } else {
      // Viewer left - remove from room and notify host
      room.viewers.delete(peerId);
      if (room.host) {
        this.send(room.host.ws, {
          type: 'leave',
          peerId,
          role: 'viewer',
        });
      }
      console.log(`[WebRTC Signaling] Viewer left room ${peer.showId} (${room.viewers.size} viewers)`);
    }

    this.peers.delete(peerId);
  }

  private handleDisconnect(peerId: string) {
    console.log(`[WebRTC Signaling] Connection closed: ${peerId}`);
    this.handleLeave(peerId);
  }

  private send(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
    });
  }

  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API for monitoring
  public getRoomStats(showId: string) {
    const room = this.rooms.get(showId);
    if (!room) return null;

    return {
      showId: room.showId,
      hasHost: !!room.host,
      viewerCount: room.viewers.size,
      createdAt: room.createdAt,
      viewers: Array.from(room.viewers.values()).map(v => ({
        peerId: v.id,
        userId: v.userId,
        connectedAt: v.connectedAt,
      })),
    };
  }

  public getAllRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      showId: room.showId,
      hasHost: !!room.host,
      viewerCount: room.viewers.size,
      createdAt: room.createdAt,
    }));
  }

  public closeRoom(showId: string) {
    const room = this.rooms.get(showId);
    if (!room) return false;

    // Notify all peers
    if (room.host) {
      this.send(room.host.ws, {
        type: 'error',
        error: 'Room closed by server',
      });
      room.host.ws.close();
    }

    room.viewers.forEach((viewer) => {
      this.send(viewer.ws, {
        type: 'error',
        error: 'Room closed by server',
      });
      viewer.ws.close();
    });

    this.rooms.delete(showId);
    return true;
  }
}

// Singleton instance
let signalingServer: WebRTCSignalingServer | null = null;

export function initializeSignalingServer(port: number = 8080) {
  if (!signalingServer) {
    signalingServer = new WebRTCSignalingServer(port);
  }
  return signalingServer;
}

export function getSignalingServer() {
  if (!signalingServer) {
    throw new Error('Signaling server not initialized. Call initializeSignalingServer() first.');
  }
  return signalingServer;
}

export { WebRTCSignalingServer };
