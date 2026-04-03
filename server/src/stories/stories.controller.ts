import {
    Controller,
    Post,
    Get,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
    Res,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { StoriesService } from './stories.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FileSizeValidationPipe } from './validators/stories.validator';
import { Types } from 'mongoose';

@Controller('stories')
@UseGuards(AuthGuard)
export class StoriesController {
    constructor(private readonly storiesService: StoriesService) {}

    @Post()
    @UseInterceptors(FileInterceptor('video', { limits: { fileSize: 50 * 1024 * 1024 } })) // лимит 50 МБ
    async createStory(@UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File, @Req() req: Request) {
        if (!file) {
            throw new BadRequestException('File was not uploaded');
        }
        const userId = req.UserData.sub;
        const username = req.UserData.username;
        const story = await this.storiesService.createStory(new Types.ObjectId(userId), username, file);
        return story;
    }

    @Get()
    async getActiveStories() {
        return await this.storiesService.getActiveStories();
    }

    @Get(':userId')
    async getUserStories(@Param('userId') userId: string) {
        return await this.storiesService.getUserStories(new Types.ObjectId(userId));
    }

    @Get(':id/video')
    async getStoryVideo(@Param('id') id: string, @Res() res: Response) {
        const { stream, file } = await this.storiesService.getStoryVideo(new Types.ObjectId(id));
        if (!file) {
            throw new NotFoundException('Video not found');
        }
        res.set({
            'Content-Type': file.metadata?.contentType as string,
            'Content-Length': file.length,
            'Content-Disposition': `inline; filename="${file.filename}"`,
        });

        stream.pipe(res);
    }
}
