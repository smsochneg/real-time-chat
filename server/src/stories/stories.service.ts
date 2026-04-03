import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { StoryDocument } from './stories.schema';
import { StoriesRepository } from './stories.repository';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class StoriesService {
    constructor(
        private readonly storiesRepository: StoriesRepository,
        private readonly userService: UsersService,
    ) {}

    async createStory(userId: Types.ObjectId, username: string, file: Express.Multer.File): Promise<StoryDocument> {
        const filename = `${userId.toString()}.${new Types.UUID().toString()}.webm`;

        const videoId = await this.storiesRepository.loadFile(file, filename, { userId, username });

        const story = await this.storiesRepository.createStory(userId, username, videoId);

        return story;
    }

    async getActiveStories() {
        const userIds = await this.storiesRepository.getUsersWithActiveStories();

        return await this.userService.getUsersById(userIds);
    }

    async getUserStories(userId: Types.ObjectId) {
        return await this.storiesRepository.getStoriesByUserId(userId);
    }

    async getStoryVideo(storyId: Types.ObjectId) {
        return await this.storiesRepository.getStoryVideo(storyId);
    }
}
