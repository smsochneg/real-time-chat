import { PipeTransform, Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
    async transform(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file in request');
        }

        try {
            const duration = await this.getDuration(Readable.from(file.buffer));

            if (!duration) {
                throw new BadRequestException('Unable to determine video duration');
            }
            if (!duration || duration - 15 > 1) {
                throw new BadRequestException('Video duration is more than 15 seconds');
            }

            return file;
        } catch (e) {
            let message;
            if (e instanceof Error) {
                message = e.message;
            }
            throw new InternalServerErrorException('Error while validating file:', message);
        }
    }

    private getDuration(buffer: Readable): Promise<number | undefined> {
        return new Promise((resolve, reject) => {
            ffmpeg(buffer).ffprobe((err: Error, data) => {
                if (err) return reject(err);
                resolve(data.format.duration);
            });
        });
    }
}
