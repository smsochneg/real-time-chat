import { Test, TestingModule } from '@nestjs/testing';
import { StoriesRepository } from './stories.repository';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Story } from './stories.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

describe('StoriesRepository', () => {
    let repository: StoriesRepository;
    let mockStoryModel: any;
    let mockGridFSBucket: any;
    const MockConfigService = {
        get: jest.fn(),
    };

    const mockUserId = new Types.ObjectId();
    const mockVideoId = new Types.ObjectId();
    const mockStoryId = new Types.ObjectId();

    const mockStory = {
        _id: mockStoryId,
        userId: mockUserId,
        username: 'testuser',
        videoId: mockVideoId,
        createdAt: new Date(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        mockGridFSBucket = {
            openUploadStream: jest.fn(),
            openDownloadStream: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
        };

        const MockStoryModelConstructor = jest.fn().mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(mockStory),
        }));

        Object.assign(MockStoryModelConstructor, {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            distinct: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
        });

        // Create a proper mock for the MongoDB connection that GridFSBucket expects
        const mockDb = {
            collection: jest.fn().mockReturnValue({
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValue([]),
                }),
                insertOne: jest.fn(),
                deleteOne: jest.fn(),
                deleteMany: jest.fn(),
            }),
            s: { namespace: { db: 'test' } },
        };

        const mockConnection = {
            db: mockDb,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoriesRepository,
                { provide: getModelToken(Story.name), useValue: MockStoryModelConstructor },
                { provide: getConnectionToken(), useValue: mockConnection },
                { provide: ConfigService, useValue: MockConfigService },
            ],
        }).compile();

        repository = module.get<StoriesRepository>(StoriesRepository);
        mockStoryModel = module.get(getModelToken(Story.name));

        // Manually set the gridFSBucket for testing (override the real one)
        (repository as any).gridFSBucket = mockGridFSBucket;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('createStory', () => {
        it('should create a new story', async () => {
            const result = await repository.createStory(mockUserId, 'testuser', mockVideoId);

            expect(mockStoryModel).toHaveBeenCalledWith({
                userId: expect.any(Types.ObjectId),
                username: 'testuser',
                videoId: mockVideoId,
            });
            expect(result).toEqual(mockStory);
        });
    });

    describe('getUsersWithActiveStories', () => {
        it('should return user IDs with active stories', async () => {
            const userIds = [mockUserId, new Types.ObjectId()];
            mockStoryModel.distinct.mockResolvedValue(userIds);

            const result = await repository.getUsersWithActiveStories();

            expect(mockStoryModel.distinct).toHaveBeenCalledWith('userId', {
                createdAt: { $gt: expect.any(Date) },
            });
            expect(result).toEqual(userIds);
        });

        it('should return empty array when no active stories', async () => {
            mockStoryModel.distinct.mockResolvedValue([]);

            const result = await repository.getUsersWithActiveStories();

            expect(result).toEqual([]);
        });
    });

    describe('getStoriesByUserId', () => {
        it('should return stories for a user', async () => {
            const stories = [mockStory];
            mockStoryModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(stories),
                }),
            });

            const result = await repository.getStoriesByUserId(mockUserId);

            expect(mockStoryModel.find).toHaveBeenCalledWith({
                userId: mockUserId,
                createdAt: { $gt: expect.any(Date) },
            });
            expect(result).toEqual(stories);
        });
    });

    describe('deleteStory', () => {
        it('should delete a story and its video', async () => {
            mockStoryModel.findById.mockResolvedValue(mockStory);
            mockGridFSBucket.delete.mockResolvedValue(undefined);
            mockStoryModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

            await repository.deleteStory(mockStoryId);

            expect(mockStoryModel.findById).toHaveBeenCalledWith(mockStoryId);
            expect(mockGridFSBucket.delete).toHaveBeenCalledWith(mockStory.videoId);
            expect(mockStoryModel.deleteOne).toHaveBeenCalledWith({ _id: mockStory._id });
        });

        it('should throw NotFoundException when story not found', async () => {
            mockStoryModel.findById.mockResolvedValue(null);

            await expect(repository.deleteStory(mockStoryId)).rejects.toThrow(NotFoundException);
            await expect(repository.deleteStory(mockStoryId)).rejects.toThrow('Story not found');
        });
    });

    describe('getStoryVideo', () => {
        it('should return video stream and file info', async () => {
            const mockFileInfo = {
                _id: mockVideoId,
                filename: 'story.webm',
                length: 1024,
                metadata: { contentType: 'video/webm' },
            };
            const mockStream = { pipe: jest.fn() };

            // Create a story with createdAt in the future relative to expiration check
            const recentCreatedAt = new Date();
            mockStoryModel.findById.mockResolvedValue({
                ...mockStory,
                createdAt: recentCreatedAt,
            });
            mockGridFSBucket.find.mockReturnValue({
                toArray: jest.fn().mockResolvedValue([mockFileInfo]),
            });
            mockGridFSBucket.openDownloadStream.mockReturnValue(mockStream);

            const result = await repository.getStoryVideo(mockStoryId);

            expect(mockStoryModel.findById).toHaveBeenCalledWith(mockStoryId);
            expect(result.stream).toBe(mockStream);
            expect(result.file).toEqual(mockFileInfo);
        });

        it('should throw NotFoundException when story not found', async () => {
            mockStoryModel.findById.mockResolvedValue(null);

            await expect(repository.getStoryVideo(mockStoryId)).rejects.toThrow(NotFoundException);
            await expect(repository.getStoryVideo(mockStoryId)).rejects.toThrow('Story not found');
        });

        it('should throw NotFoundException when video file not found', async () => {
            const recentCreatedAt = new Date();
            mockStoryModel.findById.mockResolvedValue({
                ...mockStory,
                createdAt: recentCreatedAt,
            });
            mockGridFSBucket.find.mockReturnValue({
                toArray: jest.fn().mockResolvedValue([]),
            });

            await expect(repository.getStoryVideo(mockStoryId)).rejects.toThrow(NotFoundException);
            await expect(repository.getStoryVideo(mockStoryId)).rejects.toThrow('Videofile not found');
        });
    });
});
