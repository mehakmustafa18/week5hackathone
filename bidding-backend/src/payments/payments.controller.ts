import { Controller, Post, Patch, Body, UseGuards, Param, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @UseGuards(JwtAuthGuard)
  @Post(':carId/pay')
  async pay(@Param('carId') carId: string) {
    return this.paymentsService.makePayment(carId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':carId/status')
  async updateStatus(
    @Param('carId') carId: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.paymentsService.updateShippingStatus(carId, req.user._id, status);
  }
}
