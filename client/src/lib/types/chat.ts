export interface User {
	id: string;
	username: string;
}

export interface Chat {
	id: string;
	participants: User[];
}

export type ChatList = Chat[];

export type ChatWithOnlyReciever = Pick<Chat, 'id'> & { receiver: User };

export interface Person {
	id: number;
	avatar: number;
	name: string;
}

export interface Message {
	id: string;
	chatId: string;
	sender: User;
	message: string;
	createdAt: string;
}

export interface Story {
	id: string;
	userId: string;
	videoId: string;
	createdAt: string;
}

export type Messages = Message[];
