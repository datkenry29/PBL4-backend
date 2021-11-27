const { isObject } = require('util');
const socketConsts = require('./socket_consts');

class SocketController {
    constructor(userService, messageService, socketRepo){
        this._userService = userService;
        this._messageService = messageService;
        this._socketRepo = socketRepo;
    }

    async converMessageHandler(socket, io, data) {
        let message;
        if(data.isImg){
            message = await this._messageService.addMessageToConver(data.converId, {author: data.fromUserId, content: data.content, isImg: true});
        } else {
            message = await this._messageService.addMessageToConver(data.converId, {author: data.fromUserId, content: data.content});
        }
        let result = {
            converId: data.converId,
            message: message,
        }
        io.to(`${this._socketRepo.getSocketIdByUserId(data.toUserId)}`).emit(socketConsts.EVENT_RECEIVE_CONVER_MESSAGE, result);
    }

    async  roomMessageHandler(socket, data) {
        let message;
        if(data.isImg){
            message = await this._messageService.addMessageToRoom(data.roomId, {author: data.fromUserId, content: data.content, isImg: true});
        } else {
            message = await this._messageService.addMessageToRoom(data.roomId, {author: data.fromUserId, content: data.content});
        }
        let result = {
            roomId: data.roomId,
            message: message,
        }
        socket.to(data.roomId).emit(socketConsts.EVENT_RECEIVE_ROOM_MESSAGE, result);
    }

    async friendRequestHandler(socket, io, data) {
        const F_request = await this._userService.createFriendRequest(data.fromId, data.toId);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.toId)}`).emit(socketConsts.EVENT_RECEIVE_FRIEND_REQUEST, F_request);
    }

    async addFriendHandler(socket, io, data) {
        await this._userService.addFriend(data.fromId, data.toId);
        const F_request = await this._userService.getFriendRequest(data.fromId, data.toId);
        await this._messageService.createConversation([data.fromId, data.toId]);
        await this._userService.removeFriendRequest(F_request._id);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.fromId)}`).emit(socketConsts.EVENT_NOTIFY_ACCEPT_FRIEND, F_request.to);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.toId)}`).emit(socketConsts.EVENT_NOTIFY_ACCEPT_FRIEND, F_request.from);
    }

    async removeFriendRequest(socket, io, data) {
        const F_request = await this._userService.getFriendRequestById(data.friend_request_id);
        await this._userService.removeFriendRequest(data.friend_request_id);
        if(data.fromId == F_request.from){
            io.to(`${this._socketRepo.getSocketIdByUserId(data.toId)}`).emit(socketConsts.EVENT_REMOVE_FRIEND_REQUEST, F_request)
        }
    }

    async removeFriendHandler(socket, io, data) {
        await this._userService.removeFriend(data.fromId, data.toId);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.fromId)}`).emit(socketConsts.EVENT_RECEIVE_CANCEL_FRIEND, data.toId);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.toId)}`).emit(socketConsts.EVENT_RECEIVE_CANCEL_FRIEND, data.fromId);
    }

    async joinRoomHandler(socket, io, data) {
        const room = await this._messageService.getRoomById(data.roomId);
        socket.join(`${data.roomId}`);
        io.to(`${this._socketRepo.getSocketIdByUserId(data.fromId)}`).emit(socketConsts.EVENT_RECEIVE_JOIN_ROOM, room);
    }

    async disconnectHandler(socket) {
        
    }
}

module.exports = SocketController;
