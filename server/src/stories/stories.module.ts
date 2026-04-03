import { Module } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Story, StorySchema } from './stories.schema';
import { AuthModule } from 'src/auth/auth.module';
import { StoriesRepository } from './stories.repository';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
        ScheduleModule.forRoot(),
        AuthModule,
        UsersModule,
    ],
    providers: [StoriesService, StoriesRepository],
    controllers: [StoriesController],
})
export class StoriesModule {}
