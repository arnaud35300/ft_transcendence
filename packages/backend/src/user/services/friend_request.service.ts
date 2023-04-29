// NestJS imports
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Third-party imports

// Local imports
import { FriendRequestDto } from '../dto/relationship/friend_request.dto';
import { UserEntity } from '../entities/user.entity';
import { FriendRequestStatus } from '../enum/friend_request-status.enum';
import { FriendRequestRepository } from '../repositories/friend_request.repository';

@Injectable()
export class FriendRequestService {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepository,
  ) {}

  async changeFriendRequestStatus(
    currentUser: UserEntity,
    fromUserId: string,
    status: FriendRequestStatus,
  ): Promise<void> {
    const request = await this.friendRequestRepository.findFriendRequest(
      fromUserId,
      currentUser.id,
    );
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.status !== status) {
      request.status = status;
      await this.friendRequestRepository.save(request);
    }
  }

  async deleteFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    const request = await this.friendRequestRepository.findFriendRequest(
      senderId,
      receiverId,
    );
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (
      request.status === FriendRequestStatus.approved ||
      request.status === FriendRequestStatus.rejected
    ) {
      throw new BadRequestException('Friend request already processed');
    }

    this.friendRequestRepository.delete(request);
  }

  async deleteFriendRequestBetweenUsers(
    first: string,
    second: string,
  ): Promise<void> {
    const request =
      await this.friendRequestRepository.findPossibleFriendRequest(
        first,
        second,
      );
    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    this.friendRequestRepository.delete(request);
  }

  mapRequestToDto(request: any): FriendRequestDto {
    return {
      id: request.user.id,
      name: request.user.name,
      profilePictureUrl: request.user.profilePictureUrl,
      status: request.status,
    };
  }
}