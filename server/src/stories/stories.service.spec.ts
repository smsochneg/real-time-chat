import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';
import { StoriesRepository } from './stories.repository';
import { UsersService } from 'src/users/users.service';
import { Types } from 'mongoose';

describe('StoriesService', () => {
    let service: StoriesService;
    let storiesRepository: jest.Mocked<StoriesRepository>;
    let usersService: jest.Mocked<UsersService>;

    const mockUserId = new Types.ObjectId();
    const mockVideoId = new Types.ObjectId();
    const mockStoryId = new Types.ObjectId();

    const mockUser = {
        _id: mockUserId,
        username: 'testuser',
    };

    const mockStory = {
        _id: mockStoryId,
        userId: mockUserId,
        username: 'testuser',
        videoId: mockVideoId,
        expiresAt: new Date(Date.now() + 60 * 60 * 10 * 1000),
        createdAt: new Date(),
    };

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
        const mockStoriesRepository = {
            loadFile: jest.fn(),
            createStory: jest.fn(),
            getUsersWithActiveStories: jest.fn(),
            getStoriesByUserId: jest.fn(),
            getStoryVideo: jest.fn(),
        };

        const mockUsersService = {
            getUsersById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoriesService,
                { provide: StoriesRepository, useValue: mockStoriesRepository },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<StoriesService>(StoriesService);
        storiesRepository = module.get(StoriesRepository);
        usersService = module.get(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createStory', () => {
        it('should create a story with uploaded video', async () => {
            storiesRepository.loadFile.mockResolvedValue(mockVideoId);
            storiesRepository.createStory.mockResolvedValue(mockStory as any);

            const result = await service.createStory(mockUserId, 'testuser', mockFile);

            expect(storiesRepository.loadFile).toHaveBeenCalledWith(mockFile, expect.any(String), {
                userId: mockUserId,
                username: 'testuser',
            });
            expect(storiesRepository.createStory).toHaveBeenCalledWith(mockUserId, 'testuser', mockVideoId);
            expect(result).toEqual(mockStory);
        });

        it('should propagate errors from repository', async () => {
            const error = new Error('Failed to upload file');
            storiesRepository.loadFile.mockRejectedValue(error);

            await expect(service.createStory(mockUserId, 'testuser', mockFile)).rejects.toThrow(
                'Failed to upload file',
            );
        });
    });

    describe('getActiveStories', () => {
        it('should return users with active stories', async () => {
            const userIds = [mockUserId, new Types.ObjectId()];
            const users = [mockUser, { _id: userIds[1], username: 'user2' }];

            storiesRepository.getUsersWithActiveStories.mockResolvedValue(userIds);
            usersService.getUsersById.mockResolvedValue(users as any);

            const result = await service.getActiveStories();

            expect(storiesRepository.getUsersWithActiveStories).toHaveBeenCalled();
            expect(usersService.getUsersById).toHaveBeenCalledWith(userIds);
            expect(result).toEqual(users);
        });

        it('should return empty array when no active stories', async () => {
            storiesRepository.getUsersWithActiveStories.mockResolvedValue([]);
            usersService.getUsersById.mockResolvedValue([]);

            const result = await service.getActiveStories();

            expect(result).toEqual([]);
        });
    });

    describe('getUserStories', () => {
        it('should return stories for a user', async () => {
            const stories = [mockStory, { ...mockStory, _id: new Types.ObjectId() }];
            storiesRepository.getStoriesByUserId.mockResolvedValue(stories as any);

            const result = await service.getUserStories(mockUserId);

            expect(storiesRepository.getStoriesByUserId).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(stories);
        });

        it('should return empty array when user has no stories', async () => {
            storiesRepository.getStoriesByUserId.mockResolvedValue([]);

            const result = await service.getUserStories(mockUserId);

            expect(result).toEqual([]);
        });
    });

    describe('getStoryVideo', () => {
        it('should return story video stream and file info', async () => {
            const mockStream = { pipe: jest.fn() };
            const mockFileInfo = {
                _id: mockVideoId,
                filename: 'story.webm',
                length: 1024,
                metadata: { contentType: 'video/webm' },
            };

            storiesRepository.getStoryVideo.mockResolvedValue({
                stream: mockStream as any,
                file: mockFileInfo as any,
            });

            const result = await service.getStoryVideo(mockStoryId);

            expect(storiesRepository.getStoryVideo).toHaveBeenCalledWith(mockStoryId);
            expect(result.stream).toBeDefined();
            expect(result.file).toEqual(mockFileInfo);
        });

        it('should propagate errors from repository', async () => {
            const error = new Error('Story not found');
            storiesRepository.getStoryVideo.mockRejectedValue(error);

            await expect(service.getStoryVideo(mockStoryId)).rejects.toThrow('Story not found');
        });
    });
});
