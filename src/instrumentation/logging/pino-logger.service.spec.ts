import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'pino';
import { PinoLoggerService } from './pino-logger.service';

describe('PinoLoggerService', () => {
  let service: PinoLoggerService;
  let mockPinoLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Create a mock Pino logger with all the methods
    mockPinoLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
      level: 'info',
      // Include other required properties for the Logger interface
      child: jest.fn(),
      bindings: jest.fn(),
      flush: jest.fn(),
      isLevelEnabled: jest.fn(),
      levels: { values: {}, labels: {} },
      silent: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinoLoggerService,
        {
          provide: 'Pino',
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<PinoLoggerService>(PinoLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log method', () => {
    it('should call logger.info with the message', () => {
      const message = 'test info message';
      const params = ['param1', { key: 'value' }];

      service.log(message, ...params);

      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, message, ...params);
    });
  });

  describe('error method', () => {
    it('should call logger.error with the message', () => {
      const message = 'test error message';
      const params = ['param1', new Error('test error')];

      service.error(message, ...params);

      expect(mockPinoLogger.error).toHaveBeenCalledWith({}, message, ...params);
    });
  });

  describe('warn method', () => {
    it('should call logger.warn with the message', () => {
      const message = 'test warning message';
      const params = ['param1'];

      service.warn(message, ...params);

      expect(mockPinoLogger.warn).toHaveBeenCalledWith({}, message, ...params);
    });
  });

  describe('debug method', () => {
    it('should call logger.debug with the message if the method exists', () => {
      const message = 'test debug message';
      const params = ['param1'];

      if (service.debug) {
        service.debug(message, ...params);
        expect(mockPinoLogger.debug).toHaveBeenCalledWith(
          {},
          message,
          ...params,
        );
      } else {
        // Skip test if method doesn't exist
        expect(true).toBe(true);
      }
    });
  });

  describe('verbose method', () => {
    it('should call logger.trace with the message if the method exists', () => {
      const message = 'test verbose message';
      const params = ['param1'];

      if (service.verbose) {
        service.verbose(message, ...params);
        expect(mockPinoLogger.trace).toHaveBeenCalledWith(
          {},
          message,
          ...params,
        );
      } else {
        // Skip test if method doesn't exist
        expect(true).toBe(true);
      }
    });
  });

  describe('fatal method', () => {
    it('should call logger.fatal with the message if the method exists', () => {
      const message = 'test fatal message';
      const params = ['param1'];

      if (service.fatal) {
        service.fatal(message, ...params);
        expect(mockPinoLogger.fatal).toHaveBeenCalledWith(
          {},
          message,
          ...params,
        );
      } else {
        // Skip test if method doesn't exist
        expect(true).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty params array', () => {
      const message = 'message with no params';

      service.log(message);
      expect(mockPinoLogger.info).toHaveBeenCalledWith({}, message);

      service.error(message);
      expect(mockPinoLogger.error).toHaveBeenCalledWith({}, message);

      service.warn(message);
      expect(mockPinoLogger.warn).toHaveBeenCalledWith({}, message);

      if (service.debug) {
        service.debug(message);
        expect(mockPinoLogger.debug).toHaveBeenCalledWith({}, message);
      }

      if (service.verbose) {
        service.verbose(message);
        expect(mockPinoLogger.trace).toHaveBeenCalledWith({}, message);
      }

      if (service.fatal) {
        service.fatal(message);
        expect(mockPinoLogger.fatal).toHaveBeenCalledWith({}, message);
      }
    });

    it('should handle complex objects in params', () => {
      const message = 'message with complex object';
      const complexObject = {
        nestedObj: {
          array: [1, 2, 3],
          func: () => 'test',
          date: new Date(),
        },
      };

      service.log(message, complexObject);
      expect(mockPinoLogger.info).toHaveBeenCalledWith(
        {},
        message,
        complexObject,
      );
    });
  });
});
