import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BidsService } from './bids.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BidsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly bidsService: BidsService) {}

  @OnEvent('bid.placed')
  handleBidPlaced(payload: any) {
    this.server.emit('notification', payload);
  }

  @OnEvent('car.created')
  handleCarCreated(payload: any) {
    this.server.emit('notification', payload);
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(
    @MessageBody() carId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction_${carId}`);
    console.log(`Client ${client.id} joined auction ${carId}`);
  }

  @SubscribeMessage('placeBid')
  async handlePlaceBid(
    @MessageBody() data: { carId: string; amount: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const bid = await this.bidsService.placeBid(data.carId, data.userId, data.amount);
      
      // Broadcast update to all in the room
      this.server.to(`auction_${data.carId}`).emit('bidUpdate', bid);
      
      // Global notification for new bid
      this.server.emit('notification', {
        type: 'NEW_BID',
        message: `New bid of $${data.amount} placed!`,
        carId: data.carId,
      });

      return { event: 'bidSuccess', data: bid };
    } catch (error) {
      return { event: 'bidError', message: error.message };
    }
  }

  /**
   * Emitted by the frontend when the auction timer ends.
   * Sends personalized notifications to:
   * - Winner: "You won the bid!"
   * - Seller: "Your auction was won by [name]"
   * - Losers: "You lost the bid"
   * - All: "Auction has ended"
   */
  @SubscribeMessage('auctionEnded')
  handleAuctionEnded(
    @MessageBody() data: {
      carId: string;
      carName: string;
      winnerId: string;
      winnerName: string;
      sellerId: string;
      winningAmount: number;
      loserIds: string[];
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { carId, carName, winnerId, winnerName, sellerId, winningAmount, loserIds } = data;

    // 1. Broadcast "Auction Ended" to everyone
    this.server.emit('notification', {
      type: 'AUCTION_ENDED',
      message: `Auction for ${carName} has ended!`,
      carId,
    });

    // 2. Notify Winner specifically
    this.server.emit('notification', {
      type: 'AUCTION_WIN',
      message: `🏆 Congratulations! You won the bid for ${carName} with $${winningAmount?.toLocaleString()}! Please proceed to payment.`,
      carId,
      forUserId: winnerId,
    });

    // 3. Notify Seller
    this.server.emit('notification', {
      type: 'AUCTION_SOLD',
      message: `Your ${carName} was won by ${winnerName} for $${winningAmount?.toLocaleString()}!`,
      carId,
      forUserId: sellerId,
    });

    // 4. Notify each loser individually
    loserIds.forEach((loserId) => {
      this.server.emit('notification', {
        type: 'AUCTION_LOST',
        message: `You lost the bid for ${carName}. Better luck next time!`,
        carId,
        forUserId: loserId,
      });
    });

    console.log(`Auction ${carId} ended. Winner: ${winnerName}`);
  }

  // Helper method for other services to send notifications
  sendNotification(room: string | null, event: string, data: any) {
    if (room) {
      this.server.to(room).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }
}
