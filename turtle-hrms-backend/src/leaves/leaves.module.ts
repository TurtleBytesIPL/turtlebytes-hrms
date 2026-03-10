import { Module } from '@nestjs/common';
import { LeavesController } from './leaves.controller.js';
import { LeavesService } from './leaves.service.js';

@Module({
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
