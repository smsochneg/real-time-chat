import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Story, StoryDocument } from './stories.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

interface FileUploadMetadata {
    userId: Types.ObjectId;
    username: string;
}

@Injectable()
export class StoriesRepository {
    private readonly logger = new Logger(StoriesRepository.name);
    private gridFSBucket: GridFSBucket;
    private readonly expirationSeconds: number;

    constructor(
        @InjectModel(Story.name) private readonly storyModel: Model<StoryDocument>,
        @InjectConnection() private readonly connection: Connection,
        private readonly configService: ConfigService,
    ) {
        if (this.connection.db) {
            this.gridFSBucket = new GridFSBucket(this.connection.db, {
                bucketName: 'videos',
            });
        }
        if (this.configService.get('STORIES_EXPIRATION_SECONDS')) {
            this.expirationSeconds = this.configService.get('STORIES_EXPIRATION_SECONDS') * 1000;
        } else {
            this.expirationSeconds = 24 * 60 * 60 * 1000; // Default - 24h
        }
    }

    async createStory(userId: Types.ObjectId, username: string, videoId: Types.ObjectId) {
        return await new this.storyModel({
            userId: new Types.ObjectId(userId),
            username,
            videoId,
        }).save();
    }

    async loadFile(file: Express.Multer.File, filename: string, metadata: FileUploadMetadata) {
        const uploadStream = this.gridFSBucket.openUploadStream(filename, {
            metadata,
        });

        const bufferStream = Readable.from(file.buffer);

        try {
            await pipeline(bufferStream, uploadStream);
        } catch {
            throw new InternalServerErrorException('Error while loading file to GridFS');
        }

        return uploadStream.id as Types.ObjectId;
    }

    async getUsersWithActiveStories() {
        return await this.storyModel.distinct('userId', {
            createdAt: { $gt: new Date(Date.now() - this.expirationSeconds) as Date & string },
        });
    }

    async deleteStory(storyId: Types.ObjectId): Promise<void> {
        const story = await this.storyModel.findById(storyId);
        if (!story) {
            throw new NotFoundException('Story not found');
        }

        const fileId = story.videoId;
        await this.gridFSBucket.delete(fileId);

        await this.storyModel.deleteOne({ _id: story._id });
    }

    async getStoryVideo(storyId: Types.ObjectId) {
        const story = await this.storyModel.findById(storyId);
        if (!story) {
            throw new NotFoundException('Story not found');
        }

        if (Date.now() > story.createdAt.getTime() + this.expirationSeconds) {
            await this.deleteStory(story._id);
            throw new NotFoundException('Story expired or was removed');
        }

        const fileId = new ObjectId(story.videoId);
        const files = await this.gridFSBucket.find({ _id: fileId }).toArray();
        if (files.length === 0) {
            throw new NotFoundException('Videofile not found');
        }

        const file = files[0];
        const stream = this.gridFSBucket.openDownloadStream(fileId);
        return { stream, file };
    }

    async getStoriesByUserId(userId: Types.ObjectId) {
        return this.storyModel
            .find({ userId, createdAt: { $gt: new Date(Date.now() - this.expirationSeconds) as Date & string } })
            .sort({ createdAt: 1 })
            .exec();
    }

    // Конкурентности не будет из-за { waitForCompletion: true }
    @Cron(CronExpression.EVERY_10_MINUTES, { waitForCompletion: true })
    private async handleExpiredStories() {
        this.logger.log('Stories cleanup process started');
        const startTime = Date.now();
        const expirationDate = new Date(Date.now() - this.expirationSeconds) as Date & string;

        const deletedStories = await this.storyModel.deleteMany({
            createdAt: { $lt: expirationDate },
        });

        const cursor = this.gridFSBucket.find({ uploadDate: { $lt: expirationDate } }, { projection: { _id: 1 } });

        let counter = 0;
        const batch: ObjectId[] = [];
        const batchSize = Number(this.configService.get('STORIES_CLEANUP_BATCH_SIZE')) || 10;

        for await (const doc of cursor) {
            batch.push(doc._id);

            if (batch.length >= batchSize) {
                await this.storyFilesDeleteBatch(batch);
                counter += batch.length;
                batch.length = 0;
            }
        }

        if (batch.length > 0) {
            await this.storyFilesDeleteBatch(batch);
            counter += batch.length;
        }

        this.logger.log(
            `Removed ${deletedStories.deletedCount} stories, ${counter} files [${Date.now() - startTime}ms]`,
        );
    }

    private async storyFilesDeleteBatch(ids: ObjectId[]): Promise<void> {
        await Promise.all(
            ids.map((id) =>
                this.gridFSBucket
                    .delete(id)
                    .catch((err) => this.logger.error(`Error deleting file ${id.toString()}:`, err)),
            ),
        );
    }
}
