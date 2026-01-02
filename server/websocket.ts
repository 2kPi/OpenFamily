import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface Client {
  ws: WebSocket;
  familyId: string;
  userId?: string;
}

export class SyncWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(7);
      console.log(`[WebSocket] New connection: ${clientId}`);

      // Gérer les messages du client
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'auth') {
            // Authentifier le client avec son family_id
            this.clients.set(clientId, {
              ws,
              familyId: data.familyId,
              userId: data.userId
            });
            console.log(`[WebSocket] Client ${clientId} authenticated for family ${data.familyId}`);
            
            // Envoyer confirmation
            ws.send(JSON.stringify({ type: 'auth_success', clientId }));
          } else if (data.type === 'ping') {
            // Répondre au ping pour maintenir la connexion
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      // Gérer la déconnexion
      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`[WebSocket] Error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    // Heartbeat pour maintenir les connexions actives
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping toutes les 30 secondes
  }

  /**
   * Notifier tous les clients d'une famille qu'une donnée a changé
   */
  notifyFamily(familyId: string, event: {
    type: string;
    entity: string;
    action: 'create' | 'update' | 'delete';
    data?: any;
  }) {
    let notifiedCount = 0;
    
    this.clients.forEach((client) => {
      if (client.familyId === familyId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify({
            ...event,
            timestamp: new Date().toISOString()
          }));
          notifiedCount++;
        } catch (error) {
          console.error('[WebSocket] Error sending notification:', error);
        }
      }
    });

    if (notifiedCount > 0) {
      console.log(`[WebSocket] Notified ${notifiedCount} clients in family ${familyId} about ${event.entity} ${event.action}`);
    }
  }

  /**
   * Obtenir le nombre de clients connectés pour une famille
   */
  getConnectedClientsCount(familyId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.familyId === familyId) {
        count++;
      }
    });
    return count;
  }
}
