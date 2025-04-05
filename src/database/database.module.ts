import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const uri = configService.getOrThrow<string>('MONGODB_URI');
        const appName = configService.get<string>('APP_NAME');

        return {
          uri,
          connectionName: appName,
          minPoolSize: 5,
          maxPoolSize: 10,
          maxIdleTimeMS: 60000,
          timeoutMS: 10000,
          serverSelectionTimeoutMS: 5000,
          useBigInt64: true,
        };
      },
      inject: [ConfigService],
    }),
  ],

  exports: [MongooseModule],
})
export class DatabaseModule {}
