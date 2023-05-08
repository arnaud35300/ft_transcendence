// NestJS imports
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WsException } from '@nestjs/websockets';

// Third-party imports
import { Server } from 'socket.io';

// Local imports
import { ChatGateway } from 'src/chat/chat.gateway';
import { ServerChatEvent } from 'src/chat/enum/server-chat-event.enum';
import { userIdInList } from 'src/shared/list';
import { sendEvent } from 'src/shared/websocket';
import { UserEntity } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/services/user.service';
import { LOBBY_MAX_LIFETIME, MAX_PLAYERS } from '../constants';
import { InviteToLobbyDto } from '../dto/invite-lobby.dto';
import { JoinLobbyDto } from '../dto/join-lobby.dto';
import { LobbyMode } from '../enum/lobby-mode.enum';
import { ServerGameEvents } from '../enum/server-game-event.enum';
import { AuthenticatedSocket } from '../types/AuthenticatedSocket';
import { GamePayloads } from '../types/GamePayloads';
import { Lobby } from './lobby';

@Injectable()
export class LobbyManager {
  private readonly logger: Logger = new Logger(LobbyManager.name);

  public server: Server;

  private playerQueue: Array<AuthenticatedSocket> =
    new Array<AuthenticatedSocket>();

  private readonly lobbies: Map<Lobby['id'], Lobby> = new Map<
    Lobby['id'],
    Lobby
  >();

  constructor(
    private chatGateway: ChatGateway,
    private userService: UserService,
  ) {}

  public async createLobby(client: AuthenticatedSocket): Promise<Lobby> {
    if (client.data.lobby) {
      throw new WsException('You are already in a lobby, leave it first');
    }

    if (this.playerQueue.includes(client)) {
      throw new WsException('You are in queue, please leave queue first');
    }

    const lobby = new Lobby(
      this.server,
      this.userService,
      this.chatGateway,
      LobbyMode.Custom,
    );
    this.lobbies.set(lobby.id, lobby);

    lobby.addPlayer(client);

    return lobby;
  }

  public async joinLobby(
    client: AuthenticatedSocket,
    joinLobbyDto: JoinLobbyDto,
  ): Promise<void> {
    if (client.data.lobby) {
      throw new WsException('You are already in a lobby');
    }

    if (this.playerQueue.includes(client)) {
      throw new WsException('You are in queue, please leave queue first');
    }

    const lobby = this.lobbies.get(joinLobbyDto.lobbyId);
    if (!lobby) {
      throw new WsException('Lobby not found');
    }

    if (
      lobby.mode === LobbyMode.Custom &&
      !lobby.invitedPlayers.includes(client.data.id)
    ) {
      throw new WsException('You are not invited to this lobby');
    }

    // TODO: If we make the spectator feature then add the user as spectator
    if (lobby.players.size >= MAX_PLAYERS) {
      throw new WsException('Lobby already full');
    }

    if (lobby.players.has(client.id)) {
      throw new WsException('You are already in this lobby');
    }

    lobby.addPlayer(client);
  }

  public async leaveLobbyOrThrow(client: AuthenticatedSocket): Promise<void> {
    if (!client.data.lobby) {
      throw new WsException('You are not in a lobby');
    }

    const lobby = this.lobbies.get(client.data.lobby.id);
    if (!lobby) {
      throw new WsException('Lobby not found');
    }

    if (!lobby.players.has(client.id)) {
      throw new WsException('You are not in this lobby');
    }

    lobby.removePlayer(client);

    const socketsIds = Array.from(lobby.players.keys());
    this.sendEvent(socketsIds, ServerGameEvents.GameMessage, {
      message: `${client.data.username} left the lobby`,
    });

    lobby.instance.triggerFinish();

    if (lobby.players.size === 0) {
      this.lobbies.delete(lobby.id);
    }
  }

  public async leaveLobby(client: AuthenticatedSocket): Promise<void> {
    if (!client.data.lobby) {
      return;
    }

    const lobby = this.lobbies.get(client.data.lobby.id);
    if (!lobby) {
      return;
    }

    if (!lobby.players.has(client.id)) {
      return;
    }

    lobby.removePlayer(client);

    const socketsIds = Array.from(lobby.players.keys());
    this.sendEvent(socketsIds, ServerGameEvents.GameMessage, {
      message: `${client.data.username} left the lobby`,
    });

    lobby.instance.triggerFinish();

    if (lobby.players.size === 0) {
      this.lobbies.delete(lobby.id);
    }
  }

  public async inviteToLobby(
    client: AuthenticatedSocket,
    inviteDto: InviteToLobbyDto,
  ): Promise<void> {
    if (client.data.id === inviteDto.userId) {
      throw new WsException('You cannot invite yourself');
    }

    if (!client.data.lobby) {
      throw new WsException('You are not in a lobby');
    }

    if (client.data.lobby.players.size >= MAX_PLAYERS) {
      throw new WsException('Lobby already full');
    }

    if (client.data.lobby.players.has(inviteDto.userId)) {
      throw new WsException('User already in this lobby');
    }

    if (client.data.lobby.invitedPlayers.includes(inviteDto.userId)) {
      throw new WsException('User already invited');
    }

    const user = await this.userService.findOneWithRelations(inviteDto.userId, [
      'blockedUsers',
    ]);
    if (!user) {
      throw new WsException('User not found');
    }

    if (userIdInList(user.blockedUsers, client.data.id)) {
      throw new WsException('You cannot invite this user');
    }

    client.data.lobby.invitedPlayers.push(user.id);

    this.chatGateway.sendEvent(user, ServerChatEvent.InviteToLobby, {
      userId: client.data.id,
      lobbyId: client.data.lobby.id,
    });
  }

  public async inviteToLobbyThroughChat(
    user: UserEntity,
    invitedUserId: string,
  ): Promise<string> {
    if (user.id === invitedUserId) {
      throw new WsException('You cannot invite yourself');
    }

    let lobby: Lobby | undefined = undefined;
    for (const currentLobby of this.lobbies.values()) {
      const users = Array.from(currentLobby.players.values());

      if (users.some((player) => player.data.id === user.id)) {
        lobby = currentLobby;
        break;
      }
    }
    if (!lobby) {
      throw new WsException('You are not in a lobby');
    }

    if (lobby.players.size >= MAX_PLAYERS) {
      throw new WsException('Lobby already full');
    }

    if (lobby.players.has(invitedUserId)) {
      throw new WsException('User already in this lobby');
    }

    if (lobby.invitedPlayers.includes(invitedUserId)) {
      throw new WsException('User already invited');
    }

    // TODO: see if we really want to block invitations from blocked users
    // If so we need to find the user with the blocked users relations
    if (userIdInList(user.blockedUsers, user.id)) {
      throw new WsException('You cannot invite this user');
    }

    lobby.invitedPlayers.push(user.id);

    return lobby.id;
  }

  public async setReady(
    client: AuthenticatedSocket,
    ready: boolean,
  ): Promise<void> {
    if (!client.data.lobby) {
      throw new WsException('You are not in a lobby');
    }

    await client.data.lobby.setPlayerReady(client, ready);
  }

  // -------------------- Lobby queue --------------------

  public async addPlayerToQueue(client: AuthenticatedSocket): Promise<void> {
    if (client.data.lobby) {
      throw new WsException('You are already in a lobby, leave it first');
    }

    if (this.playerQueue.includes(client)) {
      throw new WsException('You are already in queue');
    }

    this.playerQueue.push(client);
    this.tryToCreateLobby();
  }

  public async removePlayerFromQueueOrThrow(
    client: AuthenticatedSocket,
  ): Promise<void> {
    const index = this.playerQueue.findIndex(
      (player) => player.id === client.id,
    );
    if (index === -1) {
      throw new WsException('You are not in queue');
    }

    this.playerQueue.splice(index, 1);
  }

  public async removePlayerFromQueue(
    client: AuthenticatedSocket,
  ): Promise<void> {
    const index = this.playerQueue.findIndex(
      (player) => player.id === client.id,
    );
    if (index === -1) {
      return;
    }

    this.playerQueue.splice(index, 1);
  }

  public tryToCreateLobby(): void {
    if (this.playerQueue.length < MAX_PLAYERS) {
      return;
    }

    const lobby = new Lobby(this.server, this.userService, this.chatGateway);
    this.lobbies.set(lobby.id, lobby);

    this.playerQueue.splice(0, MAX_PLAYERS).forEach(async (client) => {
      lobby.addPlayer(client);
    });
  }

  // -------------------- Utils --------------------

  @Cron('*/5 * * * * *')
  public cleanUpLobbies(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_lobbyId, lobby] of this.lobbies) {
      const now = new Date().getTime();
      const lobbyCreatedAt = lobby.createdAt.getTime();
      const lobbyLifetime = now - lobbyCreatedAt;

      if (lobbyLifetime > LOBBY_MAX_LIFETIME) {
        lobby.dispatchToLobby<GamePayloads[ServerGameEvents.GameMessage]>(
          ServerGameEvents.GameMessage,
          {
            message: 'Game timed out',
          },
        );

        lobby.instance.triggerFinish();

        this.lobbies.delete(lobby.id);
      }
    }
  }

  public sendEvent<T extends keyof GamePayloads>(
    sockets: string | UserEntity | Array<string | UserEntity>,
    event: T,
    data: GamePayloads[T],
  ): void {
    sendEvent(this.server, sockets, event, data, this.userService);
  }
}