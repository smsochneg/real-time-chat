import { ConflictException, Injectable } from '@nestjs/common';
import { UserDocument, UserModel } from './users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserRequestDto } from './dto/user.create.dto';
import { MongoError } from 'mongodb';

@Injectable()
export class UsersService {
    constructor(@InjectModel(UserModel.name) private readonly userModel: Model<UserModel>) {}

    async createUser(createUserDto: CreateUserRequestDto) {
        const { username, password, email } = createUserDto;

        try {
            const user = await new this.userModel({
                username,
                password,
                email,
            }).save();

            return user;
        } catch (e) {
            if (e instanceof MongoError) {
                if (e.code === 11000) {
                    throw new ConflictException('User already exists');
                }
            }

            throw e;
        }
    }

    async getUserByUsername(username: string) {
        return await this.userModel.findOne<UserDocument>({ username }).exec();
    }

    async getUserByEmail(email: string) {
        return await this.userModel.findOne<UserDocument>({ email }).exec();
    }

    async getUserPasswordById(id: Types.ObjectId) {
        return (await this.userModel.findOne<UserDocument>({ _id: id }, { password: 1 }).exec())?.password;
    }

    async getUsersById(ids: Types.ObjectId[]) {
        return await this.userModel.find<UserDocument>({ _id: { $in: ids } }).exec();
    }
    async getUserById(id: Types.ObjectId) {
        return await this.userModel.findById<UserDocument>(id).exec();
    }

    async getAllUsers() {
        return await this.userModel.find<UserDocument>({}, { username: 1 }).exec();
    }

    async searchUsersByUsername(username: string) {
        return await this.userModel
            .find<UserDocument>({ username: { $regex: username, $options: 'i' } }, { username: 1 })
            .limit(10)
            .exec();
    }
}
