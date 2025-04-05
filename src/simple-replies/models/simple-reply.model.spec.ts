import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model, Error as MongooseError } from 'mongoose';
import { PatternType, ResponseType } from './simple-reply.constants';
import { SimpleReply, SimpleReplySchema } from './simple-reply.model';

jest.setTimeout(30000);

describe('SimpleReply Model', () => {
  let simpleReplyModel: Model<SimpleReply>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongod.getUri()),
        MongooseModule.forFeature([
          { name: SimpleReply.name, schema: SimpleReplySchema },
        ]),
      ],
    }).compile();

    simpleReplyModel = module.get<Model<SimpleReply>>(
      getModelToken(SimpleReply.name),
    );
  });

  it('should be defined', () => {
    expect(simpleReplyModel).toBeDefined();
  });

  it('should create a SimpleReply document', () => {
    const simpleReply = new simpleReplyModel({
      pattern: 'hello',
      patternType: PatternType.Exact,
      response: 'Hi there!',
      responseType: ResponseType.Text,
    });

    expect(simpleReply.pattern).toBe('hello');
    expect(simpleReply.patternType).toBe(PatternType.Exact);
    expect(simpleReply.response).toBe('Hi there!');
    expect(simpleReply.responseType).toBe(ResponseType.Text);
  });

  it('should validate required fields', async () => {
    const simpleReply = new simpleReplyModel({});
    const error = await simpleReply
      .validate()
      .catch((e: MongooseError.ValidationError) => e);

    expect(error).toBeDefined();
    if (error instanceof MongooseError.ValidationError) {
      expect(error.errors).toHaveProperty('pattern');
      expect(error.errors).toHaveProperty('response');
    }
  });

  it('should enforce unique index on pattern and patternType', async () => {
    const simpleReply1 = new simpleReplyModel({
      pattern: 'hello',
      patternType: PatternType.Exact,
      response: 'Hi there!',
      responseType: ResponseType.Text,
    });

    const simpleReply2 = new simpleReplyModel({
      pattern: 'hello',
      patternType: PatternType.Exact,
      response: 'Hello again!',
      responseType: ResponseType.Text,
    });

    await simpleReply1.save();
    await expect(simpleReply2.save()).rejects.toThrow();
  });
});
