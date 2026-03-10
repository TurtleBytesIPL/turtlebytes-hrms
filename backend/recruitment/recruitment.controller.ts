import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { RecruitmentService } from './recruitment.service.js'
import {
  CreateJobOpeningDto, UpdateJobOpeningDto,
  CreateCandidateDto, UpdateCandidateDto,
  AddCallLogDto, ScheduleInterviewDto, UpdateInterviewDto,
  CreateOfferDto, CandidateFilterDto,
} from './recruitment.dto.js'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js'
import { RolesGuard } from '../common/guards/roles.guard.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { CurrentUser } from '../common/decorators/current-user.decorator.js'
import { Role } from '@prisma/client'

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(private recruitmentService: RecruitmentService) {}

  // ─── Job Openings ──────────────────────────────────────────────────────────

  @Post('jobs')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  createJob(@CurrentUser('employeeId') id: string, @Body() dto: CreateJobOpeningDto) {
    return this.recruitmentService.createJobOpening(id, dto)
  }

  @Get('jobs')
  getJobs(@Query('all') all?: string) {
    return this.recruitmentService.getJobOpenings(all !== 'true')
  }

  @Patch('jobs/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobOpeningDto) {
    return this.recruitmentService.updateJobOpening(id, dto)
  }

  // ─── Candidates ───────────────────────────────────────────────────────────

  @Post('candidates')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  createCandidate(@CurrentUser('employeeId') id: string, @Body() dto: CreateCandidateDto) {
    return this.recruitmentService.createCandidate(id, dto)
  }

  @Get('candidates')
  getCandidates(@Query() filter: CandidateFilterDto) {
    return this.recruitmentService.getCandidates(filter)
  }

  @Get('stats')
  getStats() {
    return this.recruitmentService.getRecruitmentStats()
  }

  @Get('candidates/:id')
  getCandidate(@Param('id') id: string) {
    return this.recruitmentService.getCandidate(id)
  }

  @Patch('candidates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  updateCandidate(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.recruitmentService.updateCandidate(id, dto)
  }

  @Delete('candidates/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  deleteCandidate(@Param('id') id: string) {
    return this.recruitmentService.deleteCandidate(id)
  }

  // ─── Call Logs ────────────────────────────────────────────────────────────

  @Post('candidates/:id/calls')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  addCall(
    @Param('id') candidateId: string,
    @CurrentUser('employeeId') callerId: string,
    @Body() dto: AddCallLogDto,
  ) {
    return this.recruitmentService.addCallLog(candidateId, callerId, dto)
  }

  // ─── Interviews ───────────────────────────────────────────────────────────

  @Post('candidates/:id/interviews')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  scheduleInterview(@Param('id') candidateId: string, @Body() dto: ScheduleInterviewDto) {
    return this.recruitmentService.scheduleInterview(candidateId, dto)
  }

  @Patch('interviews/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  updateInterview(@Param('id') id: string, @Body() dto: UpdateInterviewDto) {
    return this.recruitmentService.updateInterview(id, dto)
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  @Post('candidates/:id/offer')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  createOffer(@Param('id') candidateId: string, @Body() dto: CreateOfferDto) {
    return this.recruitmentService.createOffer(candidateId, dto)
  }

  @Patch('candidates/:id/offer/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  acceptOffer(@Param('id') candidateId: string) {
    return this.recruitmentService.acceptOffer(candidateId)
  }

  @Patch('candidates/:id/offer/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  rejectOffer(@Param('id') candidateId: string, @Body('reason') reason?: string) {
    return this.recruitmentService.rejectOffer(candidateId, reason)
  }

  @Patch('candidates/:id/joined')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  markJoined(@Param('id') candidateId: string) {
    return this.recruitmentService.markJoined(candidateId)
  }
}
