import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError, NEVER } from 'rxjs';
import { RedisCacheService } from './redis-cache.service';
import { CACHE_TTL_SECONDS } from '../factoids.constants';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redisClient: jest.Mocked<ClientProxy>;

  const mockRedisClient = {
    send: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    redisClient = module.get('REDIS_CLIENT');
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      // Arrange
      const key = 'test-key';
      const value = { test: 'data' };
      const serializedValue = JSON.stringify(value);
      redisClient.send.mockReturnValue(of(serializedValue));

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toEqual(value);
      expect(redisClient.send).toHaveBeenCalledWith('get', key);
    });

    it('should return null when key does not exist', async () => {
      // Arrange
      const key = 'non-existent-key';
      redisClient.send.mockReturnValue(of(null));

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toBeNull();
      expect(redisClient.send).toHaveBeenCalledWith('get', key);
    });

    it('should return null and delete key when JSON parsing fails', async () => {
      // Arrange
      const key = 'corrupted-key';
      redisClient.send.mockReturnValueOnce(of('invalid-json'));
      redisClient.send.mockReturnValueOnce(of(1)); // for delete operation

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toBeNull();
      expect(redisClient.send).toHaveBeenCalledWith('get', key);
      expect(redisClient.send).toHaveBeenCalledWith('del', key);
    });

    it('should return null when Redis operation fails', async () => {
      // Arrange
      const key = 'test-key';
      redisClient.send.mockReturnValue(throwError(new Error('Redis error')));

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toBeNull();
      expect(redisClient.send).toHaveBeenCalledWith('get', key);
    });

    it('should return null when operation times out', async () => {
      // Arrange
      const key = 'test-key';
      redisClient.send.mockReturnValue(NEVER); // Never emits, will timeout

      // Act
      const result = await service.get(key);

      // Assert
      expect(result).toBeNull();
      expect(redisClient.send).toHaveBeenCalledWith('get', key);
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      // Arrange
      const key = 'test-key';
      const value = { test: 'data' };
      const serializedValue = JSON.stringify(value);
      redisClient.send.mockReturnValue(of('OK'));

      // Act
      await service.set(key, value);

      // Assert
      expect(redisClient.send).toHaveBeenCalledWith('setex', {
        key,
        seconds: CACHE_TTL_SECONDS,
        value: serializedValue,
      });
    });

    it('should set value with custom TTL', async () => {
      // Arrange
      const key = 'test-key';
      const value = { test: 'data' };
      const ttl = 600;
      const serializedValue = JSON.stringify(value);
      redisClient.send.mockReturnValue(of('OK'));

      // Act
      await service.set(key, value, ttl);

      // Assert
      expect(redisClient.send).toHaveBeenCalledWith('setex', {
        key,
        seconds: ttl,
        value: serializedValue,
      });
    });

    it('should throw error when Redis operation fails', async () => {
      // Arrange
      const key = 'test-key';
      const value = { test: 'data' };
      const error = new Error('Redis error');
      redisClient.send.mockReturnValue(throwError(error));

      // Act & Assert
      await expect(service.set(key, value)).rejects.toThrow(error);
    });

    it('should throw error when operation times out', async () => {
      // Arrange
      const key = 'test-key';
      const value = { test: 'data' };
      redisClient.send.mockReturnValue(NEVER); // Never emits, will timeout

      // Act & Assert
      await expect(service.set(key, value)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      // Arrange
      const key = 'test-key';
      redisClient.send.mockReturnValue(of(1));

      // Act
      await service.delete(key);

      // Assert
      expect(redisClient.send).toHaveBeenCalledWith('del', key);
    });

    it('should not throw error when Redis operation fails', async () => {
      // Arrange
      const key = 'test-key';
      redisClient.send.mockReturnValue(throwError(new Error('Redis error')));

      // Act & Assert
      await expect(service.delete(key)).resolves.toBeUndefined();
    });

    it('should not throw error when operation times out', async () => {
      // Arrange
      const key = 'test-key';
      redisClient.send.mockReturnValue(NEVER); // Never emits, will timeout

      // Act & Assert
      await expect(service.delete(key)).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all keys when no pattern provided', async () => {
      // Arrange
      redisClient.send.mockReturnValue(of('OK'));

      // Act
      await service.clear();

      // Assert
      expect(redisClient.send).toHaveBeenCalledWith('flushdb', {});
    });

    it('should clear keys matching pattern', async () => {
      // Arrange
      const pattern = 'test:*';
      const mockKeys = ['test:key1', 'test:key2'];

      // Mock SCAN response
      redisClient.send.mockReturnValueOnce(of(['0', mockKeys]));
      // Mock DEL response
      redisClient.send.mockReturnValueOnce(of(2));

      // Act
      await service.clear(pattern);

      // Assert
      expect(redisClient.send).toHaveBeenCalledWith('scan', {
        cursor: '0',
        match: pattern,
        count: 100,
      });
      expect(redisClient.send).toHaveBeenCalledWith('del', mockKeys);
    });

    it('should handle multiple SCAN iterations', async () => {
      // Arrange
      const pattern = 'test:*';
      const firstBatch = ['test:key1', 'test:key2'];
      const secondBatch = ['test:key3', 'test:key4'];

      // Mock SCAN responses - first returns cursor '1', second returns cursor '0'
      redisClient.send.mockReturnValueOnce(of(['1', firstBatch]));
      redisClient.send.mockReturnValueOnce(of(['0', secondBatch]));
      // Mock DEL responses
      redisClient.send.mockReturnValueOnce(of(2));
      redisClient.send.mockReturnValueOnce(of(2));

      // Act
      await service.clear(pattern);

      // Assert
      expect(redisClient.send).toHaveBeenCalledTimes(4); // 2 scans + 2 deletes
      expect(redisClient.send).toHaveBeenCalledWith('del', firstBatch);
      expect(redisClient.send).toHaveBeenCalledWith('del', secondBatch);
    });

    it('should throw error when flushdb fails', async () => {
      // Arrange
      const error = new Error('Redis error');
      redisClient.send.mockReturnValue(throwError(error));

      // Act & Assert
      await expect(service.clear()).rejects.toThrow(error);
    });

    it('should throw error when pattern scan fails', async () => {
      // Arrange
      const pattern = 'test:*';
      const error = new Error('Redis error');
      redisClient.send.mockReturnValue(throwError(error));

      // Act & Assert
      await expect(service.clear(pattern)).rejects.toThrow(error);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close Redis client connection', async () => {
      // Arrange
      redisClient.close.mockResolvedValue(undefined);

      // Act
      await service.onModuleDestroy();

      // Assert
      expect(redisClient.close).toHaveBeenCalled();
    });

    it('should handle connection close errors gracefully', async () => {
      // Arrange
      redisClient.close.mockRejectedValue(new Error('Close error'));

      // Act & Assert
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
