import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BidsService } from './bids.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) { }

  @Get('car/:carId')
  async getBidsForCar(@Param('carId') carId: string) {
    return this.bidsService.getBidsForCar(carId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async placeBid(@Body() bidData: any, @Req() req: any) {
    return this.bidsService.placeBid(
      bidData.carId,
      req.user._id,
      Number(bidData.amount)
    );
  }
}
