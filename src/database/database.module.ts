import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        let uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          uri = configService.get<string>('MONGODB_URI_LOCAL');
          const username = configService.get<string>('MONGODB_USERNAME');
          const password = configService.get<string>('MONGODB_PASSWORD');
          const database = configService.get<string>('MONGODB_DATABASE');
          const host = configService.get<string>('MONGODB_HOST');
          const port = configService.get<string>('MONGODB_PORT');
          uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
        }

        return {
          uri,
          minPoolSize: 1,
          maxPoolSize: 2,
          maxIdleTimeMS: 30000,
          timeoutMS: 1000,
          serverSelectionTimeoutMS: 1000,
          useBigInt64: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
