import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import {
  CreateJobOpeningDto, UpdateJobOpeningDto,
  CreateCandidateDto, UpdateCandidateDto,
  AddCallLogDto, ScheduleInterviewDto, UpdateInterviewDto,
  CreateOfferDto, CandidateFilterDto,
} from './recruitment.dto.js'
import { CandidateStatus, Role } from '@prisma/client'

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // ─── Job Openings ──────────────────────────────────────────────────────────

  async createJobOpening(createdById: string, dto: CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({
      data: {
        ...dto,
        createdById,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined,
      },
      include: { department: { select: { name: true } }, _count: { select: { candidates: true } } },
    })
  }

  async getJobOpenings(activeOnly = true) {
    return this.prisma.jobOpening.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: {
        department: { select: { name: true } },
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateJobOpening(id: string, dto: UpdateJobOpeningDto) {
    return this.prisma.jobOpening.update({
      where: { id },
      data: { ...dto, closingDate: dto.closingDate ? new Date(dto.closingDate) : undefined },
    })
  }

  // ─── Candidates ───────────────────────────────────────────────────────────

  async createCandidate(createdById: string | null, dto: CreateCandidateDto) {
    // Strip empty jobOpeningId to avoid UUID constraint failure
    const data: any = { ...dto }
    if (!data.jobOpeningId || data.jobOpeningId === '') delete data.jobOpeningId
    if (createdById) data.createdById = createdById
    return this.prisma.candidate.create({
      data,
      include: {
        jobOpening: { select: { title: true } },
        _count: { select: { calls: true, interviews: true } },
      },
    })
  }

  async getCandidates(filter: CandidateFilterDto) {
    const { search, status, role, jobOpeningId, page = 1, limit = 20 } = filter
    const skip = (Number(page) - 1) * Number(limit)
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { currentCompany: { contains: search, mode: 'insensitive' } },
        { skills: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (role) where.role = { contains: role, mode: 'insensitive' }
    if (jobOpeningId) where.jobOpeningId = jobOpeningId

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        include: {
          jobOpening: { select: { title: true } },
          _count: { select: { calls: true, interviews: true } },
          calls: { orderBy: { calledAt: 'desc' }, take: 1 },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ])

    return {
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }
  }

  async getCandidate(id: string) {
    const c = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        jobOpening: { select: { title: true, departmentId: true } },
        calls: { orderBy: { calledAt: 'desc' } },
        interviews: { orderBy: { scheduledAt: 'asc' } },
        offer: true,
      },
    })
    if (!c) throw new NotFoundException('Candidate not found')
    return c
  }

  async updateCandidate(id: string, dto: UpdateCandidateDto) {
    return this.prisma.candidate.update({
      where: { id },
      data: dto,
      include: { jobOpening: { select: { title: true } } },
    })
  }

  async deleteCandidate(id: string) {
    await this.prisma.candidate.findUniqueOrThrow({ where: { id } })
    // delete relations first
    await this.prisma.callLog.deleteMany({ where: { candidateId: id } })
    await this.prisma.interview.deleteMany({ where: { candidateId: id } })
    await this.prisma.offer.deleteMany({ where: { candidateId: id } })
    await this.prisma.candidate.delete({ where: { id } })
    return { message: 'Candidate deleted' }
  }

  // ─── Call Logs ────────────────────────────────────────────────────────────

  async addCallLog(candidateId: string, calledById: string, dto: AddCallLogDto) {
    // Update candidate status based on call outcome
    const statusMap: Record<string, CandidateStatus> = {
      ANSWERED:        CandidateStatus.CALLED,
      NO_ANSWER:       CandidateStatus.NO_ANSWER,
      CALLBACK:        CandidateStatus.CALLBACK_LATER,
      INTERESTED:      CandidateStatus.INTERESTED,
      NOT_INTERESTED:  CandidateStatus.NOT_INTERESTED,
    }

    const [log] = await Promise.all([
      this.prisma.callLog.create({
        data: {
          candidateId,
          calledById,
          status: dto.status,
          notes: dto.notes,
          nextCallDate: dto.nextCallDate ? new Date(dto.nextCallDate) : undefined,
        },
      }),
      statusMap[dto.status] && this.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: statusMap[dto.status] },
      }),
    ])

    return log
  }

  // ─── Interviews ───────────────────────────────────────────────────────────

  async scheduleInterview(candidateId: string, dto: ScheduleInterviewDto) {
    const [interview] = await Promise.all([
      this.prisma.interview.create({
        data: {
          candidateId,
          scheduledAt: new Date(dto.scheduledAt),
          mode: dto.mode,
          round: dto.round || 1,
          interviewerId: dto.interviewerId,
          location: dto.location,
          meetingLink: dto.meetingLink,
        },
      }),
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: CandidateStatus.INTERVIEW_SCHEDULED },
      }),
    ])
    return interview
  }

  async updateInterview(interviewId: string, dto: UpdateInterviewDto) {
    const interview = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        ...dto,
        conductedAt: dto.conductedAt ? new Date(dto.conductedAt) : undefined,
      },
    })

    // update candidate status based on result
    if (dto.result === 'PASS') {
      await this.prisma.candidate.update({
        where: { id: interview.candidateId },
        data: { status: CandidateStatus.INTERVIEW_DONE },
      })
    } else if (dto.result === 'FAIL') {
      await this.prisma.candidate.update({
        where: { id: interview.candidateId },
        data: { status: CandidateStatus.REJECTED },
      })
    }

    return interview
  }

  // ─── Offers ───────────────────────────────────────────────────────────────

  async createOffer(candidateId: string, dto: CreateOfferDto) {
    const [offer] = await Promise.all([
      this.prisma.offer.upsert({
        where: { candidateId },
        create: {
          candidateId,
          offeredSalary: dto.offeredSalary,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
          offerSentAt: new Date(),
        },
        update: {
          offeredSalary: dto.offeredSalary,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
          offerSentAt: new Date(),
        },
      }),
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: CandidateStatus.OFFER_SENT },
      }),
    ])
    return offer
  }

  async acceptOffer(candidateId: string) {
    await Promise.all([
      this.prisma.offer.update({
        where: { candidateId },
        data: { offerAccepted: true, acceptedAt: new Date() },
      }),
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: CandidateStatus.OFFER_ACCEPTED },
      }),
    ])
    return { message: 'Offer accepted' }
  }

  async rejectOffer(candidateId: string, reason?: string) {
    await Promise.all([
      this.prisma.offer.update({
        where: { candidateId },
        data: { offerAccepted: false, rejectedAt: new Date(), rejectionReason: reason },
      }),
      this.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: CandidateStatus.OFFER_REJECTED },
      }),
    ])
    return { message: 'Offer rejected' }
  }

  async markJoined(candidateId: string) {
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status: CandidateStatus.JOINED },
    })
    return { message: 'Candidate marked as joined. You can now create their employee profile.' }
  }

  // ─── Dashboard Stats ──────────────────────────────────────────────────────

  async getRecruitmentStats() {
    const [total, byStatus, recentCandidates, activeJobs, todayInterviews] = await Promise.all([
      this.prisma.candidate.count(),
      this.prisma.candidate.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.candidate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { jobOpening: { select: { title: true } } },
      }),
      this.prisma.jobOpening.count({ where: { isActive: true } }),
      this.prisma.interview.findMany({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: { candidate: { select: { name: true, role: true } } },
      }),
    ])

    return {
      total,
      activeJobs,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.status })),
      recentCandidates,
      todayInterviews,
      joined: byStatus.find(s => s.status === 'JOINED')?._count?.status || 0,
      inProgress: byStatus
        .filter(s => !['JOINED', 'REJECTED', 'DROPPED', 'NOT_INTERESTED', 'OFFER_REJECTED'].includes(s.status))
        .reduce((acc, s) => acc + s._count.status, 0),
    }
  }
}
