import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';
import { DatabaseConnection } from './database.constants';

@Module({
  providers: [
    {
      provide: DatabaseConnection,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<Connection> => {
        const uri = configService.getOrThrow<string>('MONGODB_URI');
        const appName = configService.get<string>('APP_NAME');

        const conn = createConnection(uri, {
          appName,
          minPoolSize: 5,
          maxPoolSize: 10,
          maxIdleTimeMS: 60000,
          timeoutMS: 10000,
          serverSelectionTimeoutMS: 5000,
          useBigInt64: true,
        });

        return conn.asPromise();
      },
    },
  ],
  exports: [DatabaseConnection],
})
export class DatabaseModule {}
