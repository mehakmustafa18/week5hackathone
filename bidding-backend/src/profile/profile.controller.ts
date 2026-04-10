import { Controller, Get, Post, UseGuards, Req, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../authentication/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get('me')
  async getMe(@Req() req: any) {
    return this.profileService.getMe(req.user._id);
  }

  @Get('cars')
  async getMyCars(@Req() req: any) {
    return this.profileService.getMyCars(req.user._id);
  }

  @Get('bids')
  async getMyBids(@Req() req: any) {
    return this.profileService.getMyBids(req.user._id);
  }

  @Get('wishlist')
  async getWishlist(@Req() req: any) {
    return this.profileService.getWishlist(req.user._id);
  }

  @Post('wishlist/:carId')
  async toggleWishlist(@Req() req: any, @Param('carId') carId: string) {
    return this.profileService.toggleWishlist(req.user._id, carId);
  }
}
