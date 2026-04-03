import { Test, TestingModule } from '@nestjs/testing';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Request, Response } from 'express';

describe('StoriesController', () => {
    let controller: StoriesController;
    let storiesService: jest.Mocked<StoriesService>;

    const mockUserId = new Types.ObjectId();
    const mockStoryId = new Types.ObjectId();
    const mockVideoId = new Types.ObjectId();

    const mockStory = {
        _id: mockStoryId,
        userId: mockUserId,
        username: 'testuser',
        videoId: mockVideoId,
        expiresAt: new Date(Date.now() + 60 * 60 * 10 * 1000),
        createdAt: new Date(),
    };

    const mockRequest = {
        UserData: {
            sub: mockUserId.toString(),
            username: 'testuser',
        },
    } as unknown as Request;

    const mockResponse = {
        set: jest.fn(),
    } as unknown as Response;

    const mockFile: Express.Multer.File = {
        fieldname: 'video',
        originalname: 'story.webm',
        encoding: '7bit',
        mimetype: 'video/webm',
        buffer: Buffer.from('test video content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
    };

    beforeEach(async () => {
        const mockStoriesService = {
            createStory: jest.fn(),
            getActiveStories: jest.fn(),
            getUserStories: jest.fn(),
            getStoryVideo: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StoriesController],
            providers: [{ provide: StoriesService, useValue: mockStoriesService }],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<StoriesController>(StoriesController);
        storiesService = module.get(StoriesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createStory', () => {
        it('should create a story', async () => {
            storiesService.createStory.mockResolvedValue(mockStory as any);

            const result = await controller.createStory(mockFile, mockRequest);

            expect(storiesService.createStory).toHaveBeenCalled();
            expect(result).toEqual(mockStory);
        });

        it('should throw BadRequestException when no file uploaded', async () => {
            await expect(controller.createStory(undefined as any, mockRequest)).rejects.toThrow(BadRequestException);
            await expect(controller.createStory(undefined as any, mockRequest)).rejects.toThrow(
                'File was not uploaded',
            );
        });

        it('should propagate errors from service', async () => {
            const error = new Error('Failed to create story');
            storiesService.createStory.mockRejectedValue(error);

            await expect(controller.createStory(mockFile, mockRequest)).rejects.toThrow('Failed to create story');
        });
    });

    describe('getActiveStories', () => {
        it('should return users with active stories', async () => {
            const users = [
                { _id: mockUserId, username: 'testuser' },
                { _id: new Types.ObjectId(), username: 'user2' },
            ];
            storiesService.getActiveStories.mockResolvedValue(users as any);

            const result = await controller.getActiveStories();

            expect(storiesService.getActiveStories).toHaveBeenCalled();
            expect(result).toEqual(users);
        });

        it('should return empty array when no active stories', async () => {
            storiesService.getActiveStories.mockResolvedValue([]);

            const result = await controller.getActiveStories();

            expect(result).toEqual([]);
        });
    });

    describe('getUserStories', () => {
        it('should return stories for a user', async () => {
            const stories = [mockStory];
            storiesService.getUserStories.mockResolvedValue(stories as any);

            const result = await controller.getUserStories(mockUserId.toString());

            expect(storiesService.getUserStories).toHaveBeenCalled();
            expect(result).toEqual(stories);
        });

        it('should return empty array when user has no stories', async () => {
            storiesService.getUserStories.mockResolvedValue([]);

            const result = await controller.getUserStories(mockUserId.toString());

            expect(result).toEqual([]);
        });
    });

    describe('getStoryVideo', () => {
        it('should stream video and set headers', async () => {
            const mockStream = { pipe: jest.fn() };
            const mockFileInfo = {
                _id: mockVideoId,
                filename: 'story.webm',
                length: 1024,
                metadata: { contentType: 'video/webm' },
            };

            storiesService.getStoryVideo.mockResolvedValue({
                stream: mockStream as any,
                file: mockFileInfo as any,
            });

            await controller.getStoryVideo(mockStoryId.toString(), mockResponse);

            expect(storiesService.getStoryVideo).toHaveBeenCalled();
            expect(mockResponse.set).toHaveBeenCalledWith({
                'Content-Type': 'video/webm',
                'Content-Length': 1024,
                'Content-Disposition': `inline; filename="${mockFileInfo.filename}"`,
            });
            expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
        });

        it('should throw NotFoundException when video not found', async () => {
            storiesService.getStoryVideo.mockResolvedValue({
                stream: {} as any,
                file: null as any,
            });

            await expect(controller.getStoryVideo(mockStoryId.toString(), mockResponse)).rejects.toThrow(
                NotFoundException,
            );
            await expect(controller.getStoryVideo(mockStoryId.toString(), mockResponse)).rejects.toThrow(
                'Video not found',
            );
        });
    });
});
